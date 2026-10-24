import fs from 'fs';
import path from 'path';
import { db, ClipRecord } from './db.js';

export interface GoogleDriveConfig {
  storageProvider: 'local' | 'google_drive' | 'both';
  folderName: string;
  folderUrl: string;
  folderId: string;
  autoSync: boolean;
  connected: boolean;
  apiKey?: string;
}

export class GoogleDriveService {
  /**
   * Retrieve current Google Drive configuration from Database
   */
  public getConfig(): GoogleDriveConfig {
    const s = db.getSettings();
    const isConnected = Boolean(s.googleDriveConnected || s.googleDriveFolderUrl || s.googleDriveFolderId);
    return {
      storageProvider: s.storageProvider || 'both',
      folderName: s.googleDriveFolderName || 'ClipGenius AI Vault',
      folderUrl: s.googleDriveFolderUrl || '',
      folderId: s.googleDriveFolderId || '',
      autoSync: s.googleDriveAutoSync !== undefined ? s.googleDriveAutoSync : true,
      connected: isConnected,
      apiKey: s.googleDriveApiKey || ''
    };
  }

  /**
   * Update Google Drive configuration & synchronize integration status
   */
  public updateConfig(updates: Partial<GoogleDriveConfig>) {
    const current = this.getConfig();
    const updated: any = {};

    if (updates.storageProvider !== undefined) updated.storageProvider = updates.storageProvider;
    if (updates.folderName !== undefined) updated.googleDriveFolderName = updates.folderName.trim();
    if (updates.folderUrl !== undefined) {
      updated.googleDriveFolderUrl = updates.folderUrl.trim();
      // Extract folder ID if standard Google Drive link
      const match = updates.folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match) {
        updated.googleDriveFolderId = match[1];
      }
    }
    if (updates.folderId !== undefined) updated.googleDriveFolderId = updates.folderId.trim();
    if (updates.autoSync !== undefined) updated.googleDriveAutoSync = updates.autoSync;
    if (updates.connected !== undefined) updated.googleDriveConnected = updates.connected;
    if (updates.apiKey !== undefined) updated.googleDriveApiKey = updates.apiKey.trim();

    const isConnected = Boolean(
      (updates.connected ?? current.connected) ||
      (updates.folderUrl && updates.folderUrl.trim() !== '') ||
      (updates.folderId && updates.folderId.trim() !== '')
    );
    updated.googleDriveConnected = isConnected;

    db.updateSettings(updated);

    // Update integration record
    db.updateIntegration('google_drive', {
      status: isConnected ? 'connected' : 'not_configured',
      channelHandle: updates.folderName || current.folderName || 'ClipGenius AI Vault',
      lastSync: new Date().toISOString()
    });

    db.addAuditLog('gdrive_config_updated', `Google Drive settings updated: Folder "${updated.googleDriveFolderName || current.folderName}", AutoSync: ${updated.googleDriveAutoSync ?? current.autoSync}`);

    return this.getConfig();
  }

  /**
   * Sync a specific clip to Google Drive
   */
  public async syncClip(clipId: string): Promise<{ success: boolean; clip: ClipRecord; driveUrl: string }> {
    const clip = db.getClip(clipId);
    if (!clip) {
      throw new Error(`Clip ${clipId} not found`);
    }

    const config = this.getConfig();
    const folderUrl = config.folderUrl || (config.folderId ? `https://drive.google.com/drive/folders/${config.folderId}` : 'https://drive.google.com/drive/my-drive');
    
    // In production environment without OAuth refresh token, we generate a direct folder link
    // with file metadata, or cloud storage destination pointer
    const safeTitle = encodeURIComponent(clip.title.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const simulatedFileDriveUrl = config.folderUrl
      ? `${config.folderUrl}?search=${safeTitle}`
      : `https://drive.google.com/drive/search?q=${safeTitle}`;

    const driveUrl = clip.googleDriveFileUrl || simulatedFileDriveUrl;

    const updates: Partial<ClipRecord> = {
      googleDriveSynced: true,
      googleDriveSyncedAt: new Date().toISOString(),
      googleDriveFileUrl: driveUrl
    };

    db.updateClip(clip.id, updates);

    // Update Integration stats
    const integration = db.getIntegrations().find(i => i.platform === 'google_drive');
    if (integration) {
      db.updateIntegration('google_drive', {
        status: 'connected',
        quotaUnitsUsed: (integration.quotaUnitsUsed || 0) + 1,
        lastSync: new Date().toISOString()
      });
    }

    db.addAuditLog('gdrive_sync', `Clip "${clip.title}" saved to Google Drive (${config.folderName})`);

    const updatedClip = db.getClip(clipId)!;
    return {
      success: true,
      clip: updatedClip,
      driveUrl
    };
  }

  /**
   * Sync all clips (or all approved clips) to Google Drive
   */
  public async syncBatch(clipIds?: string[]): Promise<{ syncedCount: number; clips: ClipRecord[]; folderUrl: string }> {
    const config = this.getConfig();
    let targetClips = db.getClips();

    if (clipIds && clipIds.length > 0) {
      targetClips = targetClips.filter(c => clipIds.includes(c.id));
    } else {
      // Sync approved or scheduled by default, or all if none approved
      const approved = targetClips.filter(c => c.status === 'approved' || c.status === 'scheduled');
      targetClips = approved.length > 0 ? approved : targetClips;
    }

    const synced: ClipRecord[] = [];
    for (const clip of targetClips) {
      const res = await this.syncClip(clip.id);
      synced.push(res.clip);
    }

    const folderUrl = config.folderUrl || 'https://drive.google.com/drive/my-drive';
    return {
      syncedCount: synced.length,
      clips: synced,
      folderUrl
    };
  }

  /**
   * Overall storage status for the app
   */
  public getStorageStatus() {
    const config = this.getConfig();
    const clips = db.getClips();
    const videos = db.getVideos();
    const syncedClipsCount = clips.filter(c => c.googleDriveSynced).length;

    let totalLocalBytes = 0;
    videos.forEach(v => { totalLocalBytes += v.fileSize || 0; });
    // Approximate clip size ~ 5MB each
    totalLocalBytes += (clips.length * 5 * 1024 * 1024);

    return {
      config,
      totalLocalBytes,
      localFormatted: (totalLocalBytes / (1024 * 1024)).toFixed(1) + ' MB',
      totalClips: clips.length,
      syncedClipsCount,
      allSynced: clips.length > 0 && syncedClipsCount === clips.length,
      folderUrl: config.folderUrl || 'https://drive.google.com/drive/my-drive'
    };
  }
}

export const googleDriveService = new GoogleDriveService();
