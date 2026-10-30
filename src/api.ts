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
  prompt?: string;
  youtubeVideoUrl?: string;
  youtubeVideoId?: string;
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

  // Voice Narration & TTS
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  openaiTtsVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  deepgramApiKey: string;
  preferredTtsProvider: 'elevenlabs' | 'openai' | 'deepgram' | 'none';

  // Stock Media & Video
  pexelsApiKey: string;
  pixabayApiKey: string;
  mediaStyle: 'stock_video' | 'motion_gradient' | 'minimal_slate';

  // Speech-to-Text
  preferredSttProvider: 'groq_whisper' | 'openai_whisper' | 'heuristic';

  // Webhooks
  webhookUrl: string;
  webhookSecret: string;
  webhookEnabled: boolean;

  // Storage & Google Drive
  storageProvider?: 'local' | 'google_drive' | 'both';
  googleDriveFolderName?: string;
  googleDriveFolderUrl?: string;
  googleDriveFolderId?: string;
  googleDriveAutoSync?: boolean;
  googleDriveConnected?: boolean;

  // General
  customDomain: string;
  defaultAspectRatio: '9:16' | '1:1' | '16:9';
  autoApproveHighVirality: boolean;
  storageQuotaMb: number;

  // Presence flags
  hasGeminiKey: boolean;
  hasOpenAiKey: boolean;
  hasAnthropicKey: boolean;
  hasGroqKey: boolean;
  hasDeepseekKey: boolean;
  hasElevenLabsKey: boolean;
  hasDeepgramKey: boolean;
  hasPexelsKey: boolean;
  hasPixabayKey: boolean;
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

  async publishToYouTube(clipId: string, options?: {
    accessToken?: string;
    privacyStatus?: string;
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
  }): Promise<{ success: boolean; videoId: string; url: string }> {
    const res = await fetch(`${API_BASE}/clips/${clipId}/publish-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Publish failed' }));
      throw new Error(err.error || 'Failed to publish to YouTube');
    }
    return res.json();
  },

  async generateFromPrompt(params: {
    prompt: string;
    aspectRatio?: '9:16' | '16:9';
    durationSec?: number;
    style?: 'cinematic' | 'kinetic' | 'editorial' | 'neon' | 'mouthwatering' | 'documentary';
    captionStyle?: 'bold-yellow' | 'karaoke-blue' | 'minimal-white' | 'red-alert';
    voiceLanguage?: string;
    voiceName?: string;
    musicBed?: boolean;
  }): Promise<ClipRecord> {
    const res = await fetch(`${API_BASE}/generate-from-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Video generation failed' }));
      throw new Error(err.error || 'Failed to generate video from prompt');
    }
    return res.json();
  },

  async enhancePrompt(prompt: string, niche?: string): Promise<{ enhancedPrompt: string; suggestedStyle: string; suggestedDuration: number }> {
    const res = await fetch(`${API_BASE}/prompt/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, niche }),
    });
    if (!res.ok) {
      throw new Error('Failed to enhance prompt');
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

  async testLlm(): Promise<{ success: boolean; response?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/settings/test-llm`, { method: 'POST' });
    return res.json();
  },

  async testTts(): Promise<{ success: boolean; provider?: string; duration?: number; url?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/settings/test-tts`, { method: 'POST' });
    return res.json();
  },

  async testMedia(topic?: string): Promise<{ success: boolean; message: string; url?: string }> {
    const res = await fetch(`${API_BASE}/settings/test-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    return res.json();
  },

  async testWebhook(): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/settings/test-webhook`, { method: 'POST' });
    return res.json();
  },

  async getStorageStatus(): Promise<{
    config: {
      storageProvider: 'local' | 'google_drive' | 'both';
      folderName: string;
      folderUrl: string;
      folderId: string;
      autoSync: boolean;
      connected: boolean;
    };
    totalLocalBytes: number;
    localFormatted: string;
    totalClips: number;
    syncedClipsCount: number;
    allSynced: boolean;
    folderUrl: string;
  }> {
    const res = await fetch(`${API_BASE}/storage/status`);
    if (!res.ok) throw new Error('Failed to fetch storage status');
    return res.json();
  },

  async updateGoogleDrive(data: {
    storageProvider?: 'local' | 'google_drive' | 'both';
    folderName?: string;
    folderUrl?: string;
    autoSync?: boolean;
    connected?: boolean;
  }): Promise<{ success: boolean; config: any }> {
    const res = await fetch(`${API_BASE}/storage/google-drive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update Google Drive configuration');
    return res.json();
  },

  async syncClipToGoogleDrive(clipId: string): Promise<{ success: boolean; clip: ClipRecord; driveUrl: string }> {
    const res = await fetch(`${API_BASE}/clips/${clipId}/sync-gdrive`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync clip to Google Drive');
    return res.json();
  },

  async syncAllClipsToGoogleDrive(clipIds?: string[]): Promise<{ syncedCount: number; clips: ClipRecord[]; folderUrl: string }> {
    const res = await fetch(`${API_BASE}/clips/sync-gdrive-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clipIds }),
    });
    if (!res.ok) throw new Error('Failed to batch sync to Google Drive');
    return res.json();
  },

  async purgeDemoData(): Promise<{ success: boolean; removedVideos: number; removedClips: number }> {
    const res = await fetch(`${API_BASE}/workspace/purge-demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to purge demo data');
    return res.json();
  },

  async resetWorkspace(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/workspace/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset workspace');
    return res.json();
  },
};
