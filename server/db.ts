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
  captionStyle: 'bold-yellow' | 'minimal-white' | 'karaoke-blue' | 'none';
  status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published';
  scheduledDate: string | null;
  scheduledTime: string | null;
  platforms: ('youtube' | 'tiktok' | 'instagram' | 'linkedin')[];
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
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
}

export interface SettingsRecord {
  geminiApiKey: string;
  groqApiKey: string;
  ollamaEndpoint: string;
  customDomain: string;
  defaultAspectRatio: '9:16' | '1:1' | '16:9';
  autoApproveHighVirality: boolean;
  storageQuotaMb: number;
}

export interface DatabaseSchema {
  videos: VideoRecord[];
  clips: ClipRecord[];
  trends: TrendItem[];
  integrations: IntegrationRecord[];
  settings: SettingsRecord;
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

const INITIAL_TRENDS: TrendItem[] = [
  {
    id: 'trend-1',
    title: 'The "Nobody is talking about this" Framework',
    category: 'Tech & AI',
    description: 'High-retention curiosity hook that highlights an underappreciated workflow or software release.',
    hookTemplate: 'Nobody is talking about this tool, but it saves me 4 hours every single day...',
    targetDuration: '30-45s',
    engagementVelocity: 'Very High',
    sampleTags: ['#tech', '#productivity', '#automation', '#tools']
  },
  {
    id: 'trend-2',
    title: 'Myth vs. Reality Rapid Debunking',
    category: 'Finance & Business',
    description: 'Contrast a common assumption against verified data in the first 3 seconds.',
    hookTemplate: 'Most people think [X] is true. Here is what actually happens when you test it...',
    targetDuration: '45-60s',
    engagementVelocity: 'High',
    sampleTags: ['#finance', '#businessgrowth', '#casestudy', '#facts']
  },
  {
    id: 'trend-3',
    title: 'The 3-Step Execution Breakdown',
    category: 'Productivity',
    description: 'Concise step-by-step tutorial format with on-screen numbering for high completion rates.',
    hookTemplate: 'Here are the exact 3 steps to [achieve outcome] without [pain point]...',
    targetDuration: '35-50s',
    engagementVelocity: 'High',
    sampleTags: ['#productivitytips', '#workflow', '#howto', '#systems']
  },
  {
    id: 'trend-4',
    title: 'The Painful Mistake Framework',
    category: 'Creator Economy',
    description: 'Relatable vulnerability hook focusing on a costly or embarrassing mistake and its fix.',
    hookTemplate: 'I wasted 6 months doing this the wrong way before I figured out this simple shift...',
    targetDuration: '40-55s',
    engagementVelocity: 'Very High',
    sampleTags: ['#contentcreator', '#growth', '#strategy', '#learnfrommistakes']
  },
  {
    id: 'trend-5',
    title: 'Direct Comparison Shootout',
    category: 'Tech & AI',
    description: 'Side-by-side analysis of two popular approaches or products with clear decision criteria.',
    hookTemplate: 'Which one is actually better: [Option A] or [Option B]? Let’s look at the numbers...',
    targetDuration: '45-60s',
    engagementVelocity: 'Steady',
    sampleTags: ['#comparison', '#review', '#techtips', '#buyersguide']
  }
];

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
  }
];

const INITIAL_SETTINGS: SettingsRecord = {
  geminiApiKey: '',
  groqApiKey: '',
  ollamaEndpoint: 'http://localhost:11434',
  customDomain: '',
  defaultAspectRatio: '9:16',
  autoApproveHighVirality: false,
  storageQuotaMb: 10240 // 10 GB default local allocation
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
        return {
          videos: parsed.videos || [],
          clips: parsed.clips || [],
          trends: parsed.trends && parsed.trends.length ? parsed.trends : INITIAL_TRENDS,
          integrations: parsed.integrations && parsed.integrations.length ? parsed.integrations : INITIAL_INTEGRATIONS,
          settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) }
        };
      }
    } catch (err) {
      console.error('Error reading database file, initializing fresh:', err);
    }

    const fresh: DatabaseSchema = {
      videos: [],
      clips: [],
      trends: INITIAL_TRENDS,
      integrations: INITIAL_INTEGRATIONS,
      settings: INITIAL_SETTINGS
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
    // Also remove associated clips
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
    this.save();
  }

  public updateClip(id: string, updates: Partial<ClipRecord>) {
    const idx = this.data.clips.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clips[idx] = { ...this.data.clips[idx], ...updates };
      this.save();
    }
  }

  public deleteClip(id: string) {
    this.data.clips = this.data.clips.filter(c => c.id !== id);
    this.save();
  }

  // Trends
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

  // Real Metrics (never fake)
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
      connectedIntegrationsCount: this.data.integrations.filter(i => i.status === 'connected').length
    };
  }
}

export const db = new Database();
