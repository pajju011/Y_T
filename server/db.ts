import fs from 'fs';
import path from 'path';

export interface VideoRecord {
  id: string;
  title: string;
  originalName: string;
  filePath: string;
  urlPath: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;
  uploadedAt: string;
  status: 'ready' | 'processing' | 'error';
  errorMessage?: string;
}

export type FramingMode = 'center' | 'left' | 'right' | 'blur_fit';

export interface ClipRecord {
  id: string;
  videoId: string;
  videoTitle: string;
  title: string;
  hook: string;
  transcript: string;
  suggestedCaption: string;
  startTime: number;
  endTime: number;
  duration: number;
  viralityScore: number;
  viralityReason: string;
  filePath: string;
  urlPath: string;
  thumbnailUrl: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
  framingMode?: FramingMode;
  captionStyle: 'bold-yellow' | 'minimal-white' | 'karaoke-blue' | 'none';
  status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published';
  scheduledDate: string | null;
  scheduledTime: string | null;
  platforms: ('youtube' | 'tiktok' | 'instagram' | 'linkedin')[];
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
  trendSourceUrl?: string;
  googleDriveFileUrl?: string;
  googleDriveSynced?: boolean;
  googleDriveSyncedAt?: string;
}

export interface TrendItem {
  id: string;
  title: string;
  category: 'Tech & AI' | 'Finance & Business' | 'Productivity' | 'Creator Economy' | 'Fitness';
  description: string;
  hookTemplate: string;
  targetDuration: string;
  engagementVelocity: 'Very High' | 'High' | 'Steady';
  sampleTags: string[];
}

export interface LiveTrend {
  id: string;
  title: string;
  snippet: string;
  source: string;
  url: string;
  niche: string;
  discoveredAt: string;
  relevanceScore: number;
  generatedClipId: string | null;
}

export interface ContentStrategy {
  channelName: string;
  niche: string;
  keywords: string[];
  targetAudience: string;
  targetRegion: string;
  language: string;
  tone: string;
  durationSec: number;
  dailyVideoLimit: number;
  autoPrepareDaily: boolean;
  preferredPlatforms: ('youtube' | 'tiktok' | 'instagram' | 'linkedin')[];
  visualMode: 'motion_text' | 'template';
  lastAutoRun: string | null;
}

export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'linkedin' | 'google_drive';

export interface IntegrationRecord {
  platform: PlatformType;
  name: string;
  status: 'connected' | 'disconnected' | 'not_configured' | 'action_required';
  channelHandle: string | null;
  quotaUnitsUsed: number;
  dailyLimit: string;
  requiresKey: boolean;
  instructions: string;
  freeTierNotes: string;
  lastSync: string | null;
  accessToken?: string;
}

export interface SettingsRecord {
  // LLM & Brain
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  groqApiKey: string;
  deepseekApiKey: string;
  ollamaEndpoint: string;
  customLlmEndpoint: string;
  customLlmKey: string;
  customLlmModel: string;
  preferredLlmProvider: 'gemini' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'ollama' | 'custom' | 'heuristic';

  // Voice Narration & Text-to-Speech (TTS)
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  openaiTtsVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  deepgramApiKey: string;
  preferredTtsProvider: 'elevenlabs' | 'openai' | 'deepgram' | 'none';

  // Stock Media & Video Footage
  pexelsApiKey: string;
  pixabayApiKey: string;
  mediaStyle: 'stock_video' | 'motion_gradient' | 'minimal_slate';

  // Speech-to-Text (Transcription)
  preferredSttProvider: 'groq_whisper' | 'openai_whisper' | 'heuristic';

  // Webhooks & Automation
  webhookUrl: string;
  webhookSecret: string;
  webhookEnabled: boolean;

  // Storage & Google Drive
  storageProvider: 'local' | 'google_drive' | 'both';
  googleDriveFolderId: string;
  googleDriveFolderName: string;
  googleDriveFolderUrl: string;
  googleDriveAutoSync: boolean;
  googleDriveConnected: boolean;
  googleDriveApiKey?: string;

  // General & Hosting
  customDomain: string;
  defaultAspectRatio: '9:16' | '1:1' | '16:9';
  autoApproveHighVirality: boolean;
  storageQuotaMb: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface DatabaseSchema {
  videos: VideoRecord[];
  clips: ClipRecord[];
  trends: TrendItem[];
  liveTrends: LiveTrend[];
  strategy: ContentStrategy;
  integrations: IntegrationRecord[];
  settings: SettingsRecord;
  auditLogs: AuditLog[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

const INITIAL_TRENDS: TrendItem[] = [];

const INITIAL_STRATEGY: ContentStrategy = {
  channelName: '',
  niche: 'Tech & AI',
  keywords: [],
  targetAudience: '',
  targetRegion: 'Global / US',
  language: 'English',
  tone: 'Informed, concise, analytical, engaging',
  durationSec: 30,
  dailyVideoLimit: 1,
  autoPrepareDaily: false,
  preferredPlatforms: ['youtube', 'tiktok', 'instagram'],
  visualMode: 'motion_text',
  lastAutoRun: null
};

const INITIAL_INTEGRATIONS: IntegrationRecord[] = [
  {
    platform: 'youtube',
    name: 'YouTube Shorts',
    status: 'not_configured',
    channelHandle: null,
    quotaUnitsUsed: 0,
    dailyLimit: '10,000 units/day (Free Google Cloud Tier)',
    requiresKey: true,
    instructions: 'Obtain a free OAuth 2.0 Client ID or YouTube Data API v3 key from Google Cloud Console. No credit card required.',
    freeTierNotes: 'Free 10,000 quota units/day is sufficient to publish ~6-10 Shorts per day with zero fees.',
    lastSync: null
  },
  {
    platform: 'tiktok',
    name: 'TikTok for Developers',
    status: 'not_configured',
    channelHandle: null,
    quotaUnitsUsed: 0,
    dailyLimit: 'Standard Rate Limit (Free Developer Account)',
    requiresKey: true,
    instructions: 'Create a free TikTok Developer app to schedule Direct Post videos, or use ClipGenius 1-click MP4 export.',
    freeTierNotes: 'TikTok Developer API is free to register. Video Kit Direct Post API requires business account verification.',
    lastSync: null
  },
  {
    platform: 'instagram',
    name: 'Instagram Reels',
    status: 'not_configured',
    channelHandle: null,
    quotaUnitsUsed: 0,
    dailyLimit: '25 API posts/day (Meta Graph API Free Tier)',
    requiresKey: true,
    instructions: 'Link an Instagram Professional / Creator account to a Facebook page, then configure Meta Graph API credentials.',
    freeTierNotes: 'Meta Graph API has no subscription fee for standard organic publishing limits.',
    lastSync: null
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn Video',
    status: 'not_configured',
    channelHandle: null,
    quotaUnitsUsed: 0,
    dailyLimit: '100 posts/day (LinkedIn Community Management API)',
    requiresKey: true,
    instructions: 'Configure LinkedIn Developer App with Member Data Portability / Share on LinkedIn permissions.',
    freeTierNotes: 'Free LinkedIn Developer portal access with standard organic sharing scopes.',
    lastSync: null
  },
  {
    platform: 'google_drive',
    name: 'Google Drive Storage',
    status: 'not_configured',
    channelHandle: 'ClipGenius AI Vault',
    quotaUnitsUsed: 0,
    dailyLimit: '15 GB Free Storage (Google Drive)',
    requiresKey: false,
    instructions: 'Save rendered 9:16 vertical clips and raw videos directly into a Google Drive folder. Paste your Google Drive Folder link or ID to auto-sync.',
    freeTierNotes: '15 GB free storage with any standard Google account. Never lose your clips and share them with your team in seconds.',
    lastSync: null
  }
];

const INITIAL_SETTINGS: SettingsRecord = {
  geminiApiKey: '',
  openaiApiKey: '',
  anthropicApiKey: '',
  groqApiKey: '',
  deepseekApiKey: '',
  ollamaEndpoint: 'http://localhost:11434',
  customLlmEndpoint: '',
  customLlmKey: '',
  customLlmModel: 'gpt-4o-mini',
  preferredLlmProvider: 'gemini',

  elevenLabsApiKey: '',
  elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
  openaiTtsVoice: 'alloy',
  deepgramApiKey: '',
  preferredTtsProvider: 'none',

  pexelsApiKey: '',
  pixabayApiKey: '',
  mediaStyle: 'motion_gradient',

  preferredSttProvider: 'heuristic',

  webhookUrl: '',
  webhookSecret: '',
  webhookEnabled: false,

  storageProvider: 'both',
  googleDriveFolderId: '',
  googleDriveFolderName: 'ClipGenius AI Vault',
  googleDriveFolderUrl: '',
  googleDriveAutoSync: true,
  googleDriveConnected: false,

  customDomain: '',
  defaultAspectRatio: '9:16',
  autoApproveHighVirality: false,
  storageQuotaMb: 10240
};

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Merge initial integrations if missing (e.g. google_drive)
        const loadedIntegrations: IntegrationRecord[] = parsed.integrations || [];
        INITIAL_INTEGRATIONS.forEach(init => {
          if (!loadedIntegrations.some((existing: any) => existing.platform === init.platform)) {
            loadedIntegrations.push(init);
          }
        });

        return {
          videos: parsed.videos || [],
          clips: parsed.clips || [],
          trends: parsed.trends || [],
          liveTrends: parsed.liveTrends || [],
          strategy: parsed.strategy || INITIAL_STRATEGY,
          integrations: loadedIntegrations,
          settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
          auditLogs: parsed.auditLogs || []
        };
      }
    } catch (err) {
      console.error('Error reading database file, initializing fresh:', err);
    }

    const fresh: DatabaseSchema = {
      videos: [],
      clips: [],
      trends: INITIAL_TRENDS,
      liveTrends: [],
      strategy: INITIAL_STRATEGY,
      integrations: INITIAL_INTEGRATIONS,
      settings: INITIAL_SETTINGS,
      auditLogs: []
    };
    this.saveData(fresh);
    return fresh;
  }

  private saveData(data: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  public save() {
    this.saveData(this.data);
  }

  // Videos
  public getVideos(): VideoRecord[] {
    return this.data.videos;
  }

  public getVideo(id: string): VideoRecord | undefined {
    return this.data.videos.find(v => v.id === id);
  }

  public addVideo(video: VideoRecord) {
    this.data.videos.unshift(video);
    this.save();
  }

  public updateVideo(id: string, updates: Partial<VideoRecord>) {
    const idx = this.data.videos.findIndex(v => v.id === id);
    if (idx !== -1) {
      this.data.videos[idx] = { ...this.data.videos[idx], ...updates };
      this.save();
    }
  }

  public deleteVideo(id: string) {
    this.data.videos = this.data.videos.filter(v => v.id !== id);
    this.data.clips = this.data.clips.filter(c => c.videoId !== id);
    this.save();
  }

  // Clips
  public getClips(): ClipRecord[] {
    return this.data.clips;
  }

  public getClip(id: string): ClipRecord | undefined {
    return this.data.clips.find(c => c.id === id);
  }

  public addClip(clip: ClipRecord) {
    this.data.clips.unshift(clip);
    this.addAuditLog('clip_created', `Clip "${clip.title}" created with status ${clip.status}`);
    this.save();
  }

  public updateClip(id: string, updates: Partial<ClipRecord>) {
    const idx = this.data.clips.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clips[idx] = { ...this.data.clips[idx], ...updates };
      this.addAuditLog('clip_updated', `Clip "${id}" updated: ${Object.keys(updates).join(', ')}`);
      this.save();
    }
  }

  public deleteClip(id: string) {
    this.data.clips = this.data.clips.filter(c => c.id !== id);
    this.addAuditLog('clip_deleted', `Clip "${id}" deleted.`);
    this.save();
  }

  // Live Trends
  public getLiveTrends(): LiveTrend[] {
    return this.data.liveTrends;
  }

  public setLiveTrends(trends: LiveTrend[]) {
    this.data.liveTrends = trends;
    this.save();
  }

  public addLiveTrends(newTrends: LiveTrend[]) {
    const existingUrls = new Set(this.data.liveTrends.map(t => t.url));
    const toAdd = newTrends.filter(t => !existingUrls.has(t.url));
    if (toAdd.length > 0) {
      this.data.liveTrends = [...toAdd, ...this.data.liveTrends].slice(0, 50); // Keep latest 50
      this.save();
    }
  }

  // Strategy
  public getStrategy(): ContentStrategy {
    return this.data.strategy || INITIAL_STRATEGY;
  }

  public updateStrategy(updates: Partial<ContentStrategy>) {
    this.data.strategy = { ...this.getStrategy(), ...updates };
    this.addAuditLog('strategy_updated', `Strategy updated for niche "${this.data.strategy.niche}"`);
    this.save();
  }

  // Trends Templates
  public getTrends(): TrendItem[] {
    return this.data.trends;
  }

  // Integrations
  public getIntegrations(): IntegrationRecord[] {
    return this.data.integrations;
  }

  public updateIntegration(platform: string, updates: Partial<IntegrationRecord>) {
    const idx = this.data.integrations.findIndex(i => i.platform === platform);
    if (idx !== -1) {
      this.data.integrations[idx] = { ...this.data.integrations[idx], ...updates };
      this.save();
    }
  }

  // Settings
  public getSettings(): SettingsRecord {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SettingsRecord>) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
  }

  // Audit Logs
  public addAuditLog(action: string, details: string) {
    if (!this.data.auditLogs) this.data.auditLogs = [];
    this.data.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details
    });
    if (this.data.auditLogs.length > 100) this.data.auditLogs = this.data.auditLogs.slice(0, 100);
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs || [];
  }

  // Real Metrics
  public getMetrics() {
    const totalVideos = this.data.videos.length;
    const totalClips = this.data.clips.length;
    const approvedClips = this.data.clips.filter(c => c.status === 'approved' || c.status === 'scheduled' || c.status === 'published').length;
    const scheduledClips = this.data.clips.filter(c => c.status === 'scheduled').length;
    const inReviewClips = this.data.clips.filter(c => c.status === 'in_review').length;
    const publishedClips = this.data.clips.filter(c => c.status === 'published').length;

    let totalStorageBytes = 0;
    this.data.videos.forEach(v => {
      totalStorageBytes += v.fileSize || 0;
    });

    const platformDistribution = {
      youtube: this.data.clips.filter(c => c.platforms.includes('youtube')).length,
      tiktok: this.data.clips.filter(c => c.platforms.includes('tiktok')).length,
      instagram: this.data.clips.filter(c => c.platforms.includes('instagram')).length,
      linkedin: this.data.clips.filter(c => c.platforms.includes('linkedin')).length
    };

    return {
      totalVideos,
      totalClips,
      approvedClips,
      scheduledClips,
      inReviewClips,
      publishedClips,
      totalStorageBytes,
      storageFormatted: (totalStorageBytes / (1024 * 1024)).toFixed(1) + ' MB',
      platformDistribution,
      connectedIntegrationsCount: this.data.integrations.filter(i => i.status === 'connected').length,
      liveTrendsCount: (this.data.liveTrends || []).length
    };
  }

  // Purge any synthetic demo/sample records and their files from workspace
  public purgeDemoData(): { removedVideos: number; removedClips: number } {
    const isDemoVideo = (v: VideoRecord) =>
      v.id.startsWith('vid-demo-') ||
      (v.originalName && v.originalName.toLowerCase().includes('demo')) ||
      (v.title && v.title.toLowerCase().includes('sample product tour'));

    const isDemoClip = (c: ClipRecord) =>
      c.id.startsWith('trend-vid-') ||
      c.videoId.startsWith('vid-demo-') ||
      (c.videoTitle && c.videoTitle.includes('AI Trend:'));

    const demoVideos = this.data.videos.filter(isDemoVideo);
    const demoClips = this.data.clips.filter(isDemoClip);

    for (const v of demoVideos) {
      if (v.filePath && fs.existsSync(v.filePath)) {
        try { fs.unlinkSync(v.filePath); } catch {}
      }
    }

    for (const c of demoClips) {
      if (c.filePath && fs.existsSync(c.filePath)) {
        try { fs.unlinkSync(c.filePath); } catch {}
      }
      if (c.thumbnailUrl) {
        const thumbPath = path.resolve(process.cwd(), c.thumbnailUrl.replace(/^\//, ''));
        if (fs.existsSync(thumbPath)) {
          try { fs.unlinkSync(thumbPath); } catch {}
        }
      }
    }

    this.data.videos = this.data.videos.filter(v => !isDemoVideo(v));
    this.data.clips = this.data.clips.filter(c => !isDemoClip(c));
    this.data.trends = [];
    this.addAuditLog('demo_purged', `Cleaned workspace: removed ${demoVideos.length} demo videos and ${demoClips.length} test clips.`);
    this.save();

    return { removedVideos: demoVideos.length, removedClips: demoClips.length };
  }

  // Reset entire workspace to pristine clean state
  public resetWorkspace() {
    for (const v of this.data.videos) {
      if (v.filePath && fs.existsSync(v.filePath)) {
        try { fs.unlinkSync(v.filePath); } catch {}
      }
    }
    for (const c of this.data.clips) {
      if (c.filePath && fs.existsSync(c.filePath)) {
        try { fs.unlinkSync(c.filePath); } catch {}
      }
    }
    this.data.videos = [];
    this.data.clips = [];
    this.data.trends = [];
    this.addAuditLog('workspace_reset', 'Workspace reset to clean state with 0 videos and 0 clips.');
    this.save();
  }
}

export const db = new Database();
