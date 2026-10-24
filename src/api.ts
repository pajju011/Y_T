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

export interface IntegrationRecord {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'linkedin';
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

export interface HighlightCandidate {
  title: string;
  hook: string;
  startTime: number;
  endTime: number;
  duration: number;
  viralityScore: number;
  viralityReason: string;
  suggestedCaption: string;
  transcriptSample: string;
}

export interface SystemInfo {
  ffmpeg: {
    available: boolean;
    version: string;
    ffmpegBinary: string;
    ffprobeBinary: string;
    hasYtDlp?: boolean;
  };
  activeAiProvider: string;
  customDomain: string;
  automation?: {
    autoPrepareDaily: boolean;
    lastAutoRun: string | null;
    niche: string;
    dailyVideoLimit: number;
    isRunning: boolean;
  };
  timestamp: string;
}

export interface MetricsData {
  totalVideos: number;
  totalClips: number;
  approvedClips: number;
  scheduledClips: number;
  inReviewClips: number;
  publishedClips: number;
  totalStorageBytes: number;
  storageFormatted: string;
  platformDistribution: {
    youtube: number;
    tiktok: number;
    instagram: number;
    linkedin: number;
  };
  connectedIntegrationsCount: number;
  liveTrendsCount?: number;
}

export interface SettingsData {
  geminiApiKey: string;
  groqApiKey: string;
  ollamaEndpoint: string;
  customDomain: string;
  defaultAspectRatio: '9:16' | '1:1' | '16:9';
  autoApproveHighVirality: boolean;
  storageQuotaMb: number;
  hasGeminiKey: boolean;
  hasGroqKey: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

const API_BASE = '/api';

export const api = {
  async getSystemInfo(): Promise<SystemInfo> {
    const res = await fetch(`${API_BASE}/system`);
    if (!res.ok) throw new Error('Failed to fetch system info');
    return res.json();
  },

  async getMetrics(): Promise<MetricsData> {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getStrategy(): Promise<ContentStrategy> {
    const res = await fetch(`${API_BASE}/strategy`);
    if (!res.ok) throw new Error('Failed to fetch content strategy');
    return res.json();
  },

  async updateStrategy(data: Partial<ContentStrategy>): Promise<ContentStrategy> {
    const res = await fetch(`${API_BASE}/strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update content strategy');
    return res.json();
  },

  async getLiveTrends(): Promise<LiveTrend[]> {
    const res = await fetch(`${API_BASE}/trends/live`);
    if (!res.ok) throw new Error('Failed to fetch live trends');
    return res.json();
  },

  async discoverTrends(niche?: string, keywords?: string[]): Promise<LiveTrend[]> {
    const res = await fetch(`${API_BASE}/trends/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, keywords }),
    });
    if (!res.ok) throw new Error('Failed to discover live trends');
    return res.json();
  },

  async searchTrends(topic: string): Promise<LiveTrend[]> {
    const res = await fetch(`${API_BASE}/trends/search?q=${encodeURIComponent(topic)}`);
    if (!res.ok) throw new Error('Failed to search trends');
    return res.json();
  },

  async generateVideoFromTrend(trendId: string, trendData?: Partial<LiveTrend>, framework?: string): Promise<ClipRecord> {
    const res = await fetch(`${API_BASE}/trends/${trendId}/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(trendData || {}), framework }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Video generation failed' }));
      throw new Error(err.error || 'Failed to generate trend video');
    }
    return res.json();
  },

  async runAutomationNow(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/automation/run-now`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run automation pipeline');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getVideos(): Promise<VideoRecord[]> {
    const res = await fetch(`${API_BASE}/videos`);
    if (!res.ok) throw new Error('Failed to fetch videos');
    return res.json();
  },

  async uploadVideo(file: File, title?: string): Promise<VideoRecord> {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/videos/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload video');
    }
    return res.json();
  },

  async importYouTubeVideo(url: string): Promise<VideoRecord> {
    const res = await fetch(`${API_BASE}/videos/import-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'YouTube import failed' }));
      throw new Error(err.error || 'Failed to download YouTube video');
    }
    return res.json();
  },

  async createDemoVideo(): Promise<VideoRecord> {
    const res = await fetch(`${API_BASE}/videos/demo`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create demo video' }));
      throw new Error(err.error || 'Failed to generate demo video');
    }
    return res.json();
  },

  async deleteVideo(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/videos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete video');
  },

  async analyzeVideo(id: string, targetDuration: number = 30): Promise<{ videoId: string; candidates: HighlightCandidate[] }> {
    const res = await fetch(`${API_BASE}/videos/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDuration }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(err.error || 'Analysis failed');
    }
    return res.json();
  },

  async cutClip(videoId: string, params: {
    title: string;
    hook: string;
    startTime: number;
    endTime: number;
    viralityScore: number;
    viralityReason: string;
    suggestedCaption: string;
    aspectRatio?: '9:16' | '1:1' | '16:9';
    framingMode?: FramingMode;
    captionStyle?: 'bold-yellow' | 'minimal-white' | 'karaoke-blue' | 'none';
  }): Promise<ClipRecord> {
    const res = await fetch(`${API_BASE}/videos/${videoId}/cut-clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Clip cutting failed' }));
      throw new Error(err.error || 'Failed to render clip');
    }
    return res.json();
  },

  async getClips(filter?: { status?: string; videoId?: string }): Promise<ClipRecord[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.videoId) params.set('videoId', filter.videoId);
    const url = `${API_BASE}/clips${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch clips');
    return res.json();
  },

  async updateClip(id: string, updates: Partial<ClipRecord>): Promise<ClipRecord> {
    const res = await fetch(`${API_BASE}/clips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update clip');
    return res.json();
  },

  async deleteClip(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/clips/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete clip');
  },

  async publishToYouTube(clipId: string, accessToken?: string, privacyStatus?: string): Promise<{ success: boolean; videoId: string; url: string }> {
    const res = await fetch(`${API_BASE}/clips/${clipId}/publish-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, privacyStatus }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Publish failed' }));
      throw new Error(err.error || 'Failed to publish to YouTube Shorts');
    }
    return res.json();
  },

  async getTrends(): Promise<TrendItem[]> {
    const res = await fetch(`${API_BASE}/trends`);
    if (!res.ok) throw new Error('Failed to fetch trends');
    return res.json();
  },

  async getIntegrations(): Promise<IntegrationRecord[]> {
    const res = await fetch(`${API_BASE}/integrations`);
    if (!res.ok) throw new Error('Failed to fetch integrations');
    return res.json();
  },

  async updateIntegration(platform: string, data: { channelHandle?: string; apiKey?: string; accessToken?: string; status?: string }): Promise<IntegrationRecord> {
    const res = await fetch(`${API_BASE}/integrations/${platform}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update integration');
    return res.json();
  },

  async getSettings(): Promise<SettingsData> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data: Partial<SettingsData>): Promise<void> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save settings');
  },
};
