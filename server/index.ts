import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ZipArchive } from 'archiver';
import { db, VideoRecord, ClipRecord, ContentStrategy } from './db.js';
import { ffmpegService, FramingMode, AspectRatio, CaptionStyle } from './ffmpeg.js';
import { aiService } from './ai.js';
import { youtubeService } from './youtube.js';
import { trendDiscoveryService } from './trends.js';
import { trendVideoGenerator } from './generator.js';
import { automationEngine } from './automation.js';
import { ttsService } from './tts.js';
import { stockMediaService } from './stockMedia.js';
import { webhookService } from './webhooks.js';
import { googleDriveService } from './googleDrive.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static uploads
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadsDir, 'videos');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (.mp4, .mov, .webm, .mkv) are supported.'));
    }
  }
});

// System Status
app.get('/api/system', (req, res) => {
  const ffmpegStatus = ffmpegService.getStatus();
  const settings = db.getSettings();
  const autoStatus = automationEngine.getStatus();
  res.json({
    ffmpeg: ffmpegStatus,
    activeAiProvider: settings.geminiApiKey ? 'Google Gemini 2.0 Flash' : 'Built-in Local Pattern Engine (100% Free)',
    customDomain: settings.customDomain || 'Not configured (runs locally on localhost:5173)',
    automation: autoStatus,
    timestamp: new Date().toISOString()
  });
});

// Real Metrics
app.get('/api/metrics', (req, res) => {
  const metrics = db.getMetrics();
  res.json(metrics);
});

// Content Strategy API
app.get('/api/strategy', (req, res) => {
  res.json(db.getStrategy());
});

app.post('/api/strategy', (req, res) => {
  const updates: Partial<ContentStrategy> = req.body;
  db.updateStrategy(updates);
  res.json(db.getStrategy());
});

// Live Trend Discovery API (RSS / News)
app.get('/api/trends/live', (req, res) => {
  res.json(db.getLiveTrends());
});

app.post('/api/trends/discover', async (req, res) => {
  try {
    const strategy = db.getStrategy();
    const niche = req.body.niche || strategy.niche;
    const keywords = req.body.keywords || strategy.keywords;
    const trends = await trendDiscoveryService.discoverTrends(niche, keywords);
    res.json(trends);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to discover trends: ' + err.message });
  }
});

app.get('/api/trends/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const results = await trendDiscoveryService.searchLiveTopic(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to search trends: ' + err.message });
  }
});

// Text-To-Video: Generate 9:16 Video from Trend Topic (0 Uploads Required!)
app.post('/api/trends/:id/generate-video', async (req, res) => {
  try {
    const liveTrends = db.getLiveTrends();
    const trend = liveTrends.find(t => t.id === req.params.id) || {
      id: req.params.id,
      title: req.body.title || 'Breaking Tech Announcement',
      snippet: req.body.snippet || 'High impact trend breaking across social media.',
      source: 'Direct Trend Input',
      url: req.body.url || 'https://google.com',
      niche: req.body.niche || 'Tech & AI',
      discoveredAt: new Date().toISOString(),
      relevanceScore: 94,
      generatedClipId: null
    };

    const strategy = db.getStrategy();
    const clip = await trendVideoGenerator.generateTrendVideo(trend, strategy, req.body.framework);

    // Auto-sync to Google Drive if configured
    const s = db.getSettings();
    if (s.googleDriveAutoSync && (s.googleDriveConnected || s.googleDriveFolderUrl)) {
      googleDriveService.syncClip(clip.id).catch(e => console.error('Auto-sync to Google Drive failed:', e));
    }

    res.json(clip);
  } catch (err: any) {
    console.error('Trend video generation failed:', err);
    res.status(500).json({ error: 'Video generation failed: ' + err.message });
  }
});

// AI Prompt-To-Video: Generate Video from Custom User Prompt (Supports 9:16 and 16:9)
app.post('/api/generate-from-prompt', async (req, res) => {
  try {
    const {
      prompt,
      aspectRatio = '9:16',
      durationSec = 30,
      style = 'cinematic',
      captionStyle = 'bold-yellow',
      voiceLanguage = 'English',
      voiceName = 'en-US-ChristopherNeural',
      musicBed = true
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const clip = await trendVideoGenerator.generateVideoFromPrompt({
      prompt: prompt.trim(),
      aspectRatio,
      durationSec: Number(durationSec) || 30,
      style,
      captionStyle,
      voiceLanguage,
      voiceName,
      musicBed
    });

    // Auto-sync to Google Drive if configured
    const s = db.getSettings();
    if (s.googleDriveAutoSync && (s.googleDriveConnected || s.googleDriveFolderUrl)) {
      googleDriveService.syncClip(clip.id).catch(e => console.error('Auto-sync to Google Drive failed:', e));
    }

    res.json(clip);
  } catch (err: any) {
    console.error('Prompt video generation failed:', err);
    res.status(500).json({ error: 'Video generation failed: ' + err.message });
  }
});

// AI Prompt Enhancement
app.post('/api/prompt/enhance', async (req, res) => {
  try {
    const { prompt, niche } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const result = await trendVideoGenerator.enhancePrompt(prompt, niche);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Daily Automation Trigger & Status
app.get('/api/automation/status', (req, res) => {
  res.json(automationEngine.getStatus());
});

app.post('/api/automation/run-now', async (req, res) => {
  try {
    console.log('[API] User triggered manual run of Daily Automation Pipeline...');
    await automationEngine.runPipelineNow();
    res.json({ success: true, message: 'Daily pipeline executed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Automation run failed: ' + err.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  res.json(db.getAuditLogs());
});

// List Videos
app.get('/api/videos', (req, res) => {
  const videos = db.getVideos();
  res.json(videos);
});

// Upload Video (Local File)
app.post('/api/videos/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const videoId = 'vid-' + Date.now();
    const filePath = req.file.path;
    const urlPath = `/uploads/videos/${req.file.filename}`;

    const meta = await ffmpegService.getVideoMetadata(filePath);

    const thumbFilename = `thumb-${videoId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    const thumbUrl = `/uploads/thumbnails/${thumbFilename}`;
    try {
      await ffmpegService.extractThumbnail(filePath, thumbPath, 1);
    } catch (e) {}

    const newVideo: VideoRecord = {
      id: videoId,
      title: req.body.title || path.parse(req.file.originalname).name,
      originalName: req.file.originalname,
      filePath: filePath,
      urlPath: urlPath,
      fileSize: req.file.size,
      duration: meta.duration,
      width: meta.width,
      height: meta.height,
      uploadedAt: new Date().toISOString(),
      status: 'ready'
    };

    db.addVideo(newVideo);
    res.json(newVideo);
  } catch (err: any) {
    console.error('Video upload failed:', err);
    res.status(500).json({ error: err.message || 'Failed to process uploaded video' });
  }
});

// Import Video from YouTube URL (yt-dlp)
app.post('/api/videos/import-youtube', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Please provide a valid YouTube URL.' });
    }

    console.log(`[YouTube Import] Downloading ${url} via yt-dlp...`);
    const videosDest = path.join(uploadsDir, 'videos');
    const dlResult = await ffmpegService.downloadYouTubeVideo(url, videosDest);

    const videoId = 'vid-yt-' + Date.now();
    const filename = path.basename(dlResult.filePath);
    const urlPath = `/uploads/videos/${filename}`;

    const meta = await ffmpegService.getVideoMetadata(dlResult.filePath);

    const thumbFilename = `thumb-${videoId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    try {
      await ffmpegService.extractThumbnail(dlResult.filePath, thumbPath, 2);
    } catch (e) {}

    const newVideo: VideoRecord = {
      id: videoId,
      title: dlResult.title || 'YouTube Ingested Video',
      originalName: filename,
      filePath: dlResult.filePath,
      urlPath: urlPath,
      fileSize: meta.size,
      duration: meta.duration,
      width: meta.width,
      height: meta.height,
      uploadedAt: new Date().toISOString(),
      status: 'ready'
    };

    db.addVideo(newVideo);
    res.json(newVideo);
  } catch (err: any) {
    console.error('YouTube import failed:', err);
    res.status(500).json({ error: err.message || 'Failed to download YouTube video' });
  }
});

// Create Instant Demo Video
app.post('/api/videos/demo', async (req, res) => {
  try {
    const videoId = 'vid-demo-' + Date.now();
    const filename = `demo-${Date.now()}.mp4`;
    const filePath = path.join(uploadsDir, 'videos', filename);
    const urlPath = `/uploads/videos/${filename}`;

    await ffmpegService.createDemoVideo(filePath);
    const meta = await ffmpegService.getVideoMetadata(filePath);

    const thumbFilename = `thumb-${videoId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    try {
      await ffmpegService.extractThumbnail(filePath, thumbPath, 2);
    } catch (e) {}

    const newVideo: VideoRecord = {
      id: videoId,
      title: 'Sample Product Tour & Feature Walkthrough',
      originalName: 'demo-sample-video.mp4',
      filePath: filePath,
      urlPath: urlPath,
      fileSize: meta.size || 1500000,
      duration: meta.duration || 45,
      width: meta.width || 1920,
      height: meta.height || 1080,
      uploadedAt: new Date().toISOString(),
      status: 'ready'
    };

    db.addVideo(newVideo);
    res.json(newVideo);
  } catch (err: any) {
    console.error('Failed to create demo video:', err);
    res.status(500).json({ error: 'FFmpeg demo video creation failed: ' + err.message });
  }
});

// Delete Video
app.delete('/api/videos/:id', (req, res) => {
  const video = db.getVideo(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  if (fs.existsSync(video.filePath)) {
    try { fs.unlinkSync(video.filePath); } catch (e) {}
  }

  // Also clean up thumbnail
  const thumbPath = path.join(uploadsDir, 'thumbnails', `thumb-${video.id}.jpg`);
  if (fs.existsSync(thumbPath)) {
    try { fs.unlinkSync(thumbPath); } catch (e) {}
  }

  db.deleteVideo(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Analyze Video for Highlights
app.post('/api/videos/:id/analyze', async (req, res) => {
  try {
    const video = db.getVideo(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const targetDuration = parseInt(req.body.targetDuration || '30', 10);
    const candidates = await aiService.analyzeVideo(video, targetDuration);
    res.json({ videoId: video.id, candidates });
  } catch (err: any) {
    console.error('Analysis failed:', err);
    res.status(500).json({ error: err.message || 'Highlight detection failed' });
  }
});

// Cut Clip with FFmpeg
app.post('/api/videos/:id/cut-clip', async (req, res) => {
  try {
    const video = db.getVideo(req.params.id);
    if (!video) return res.status(404).json({ error: 'Source video not found' });

    const {
      title,
      hook,
      startTime,
      endTime,
      viralityScore,
      viralityReason,
      suggestedCaption,
      aspectRatio = '9:16',
      framingMode = 'center',
      captionStyle = 'bold-yellow'
    } = req.body;

    const startSec = Math.max(0, parseFloat(startTime || '0'));
    const endSec = Math.min(video.duration, parseFloat(endTime || '30'));
    const clipDuration = Math.max(1, endSec - startSec);

    const clipId = 'clip-' + Date.now();
    const clipFilename = `clip-${clipId}.mp4`;
    const outputPath = path.join(uploadsDir, 'clips', clipFilename);
    const urlPath = `/uploads/clips/${clipFilename}`;

    await ffmpegService.cutVerticalClip(video.filePath, outputPath, {
      startTime: startSec,
      duration: clipDuration,
      aspectRatio: aspectRatio as AspectRatio,
      framingMode: framingMode as FramingMode,
      captionStyle: captionStyle as CaptionStyle,
      hookText: hook || title
    });

    const thumbFilename = `thumb-${clipId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    const thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
    try {
      await ffmpegService.extractThumbnail(outputPath, thumbPath, 1);
    } catch (e) {}

    const newClip: ClipRecord = {
      id: clipId,
      videoId: video.id,
      videoTitle: video.title,
      title: title || `${video.title} (Short #${db.getClips().length + 1})`,
      hook: hook || 'Key takeaway highlighted from source video.',
      transcript: req.body.transcript || 'High-retention dialogue segment.',
      suggestedCaption: suggestedCaption || `${title} #shorts #trends`,
      startTime: startSec,
      endTime: endSec,
      duration: clipDuration,
      viralityScore: viralityScore || 85,
      viralityReason: viralityReason || 'Clear pacing and strong initial premise hook.',
      filePath: outputPath,
      urlPath: urlPath,
      thumbnailUrl: thumbnailUrl,
      aspectRatio: aspectRatio as AspectRatio,
      captionStyle: captionStyle as CaptionStyle,
      status: 'in_review',
      scheduledDate: null,
      scheduledTime: null,
      platforms: ['youtube', 'tiktok'],
      createdAt: new Date().toISOString(),
      approvedAt: null,
      publishedAt: null
    };

    db.addClip(newClip);

    // Auto-sync to Google Drive if configured
    const s = db.getSettings();
    if (s.googleDriveAutoSync && (s.googleDriveConnected || s.googleDriveFolderUrl)) {
      googleDriveService.syncClip(newClip.id).catch(e => console.error('Auto-sync to Google Drive failed:', e));
    }

    res.json(newClip);
  } catch (err: any) {
    console.error('Failed to cut clip:', err);
    res.status(500).json({ error: err.message || 'Clip rendering failed' });
  }
});

// List Clips
app.get('/api/clips', (req, res) => {
  const { status, videoId } = req.query;
  let clips = db.getClips();

  if (status) {
    clips = clips.filter(c => c.status === status);
  }
  if (videoId) {
    clips = clips.filter(c => c.videoId === videoId);
  }

  res.json(clips);
});

// Batch ZIP Export
app.get('/api/clips/export-zip', (req, res) => {
  try {
    const clips = db.getClips().filter(c => c.status === 'approved' || c.status === 'scheduled');
    if (clips.length === 0) {
      return res.status(400).json({ error: 'No approved clips available to export.' });
    }

    const archive = new ZipArchive({ zlib: { level: 9 } });

    res.attachment(`ClipGenius_Approved_Clips_${Date.now()}.zip`);
    archive.pipe(res);

    let summaryText = `CLIPGENIUS AI - APPROVED CLIPS EXPORT\nGenerated: ${new Date().toISOString()}\nTotal Clips: ${clips.length}\n\n`;

    clips.forEach((clip, index) => {
      const safeTitle = clip.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const clipNumber = String(index + 1).padStart(2, '0');
      const filenameInZip = `${clipNumber}_${safeTitle}.mp4`;
      const txtInZip = `${clipNumber}_${safeTitle}_captions.txt`;

      if (fs.existsSync(clip.filePath)) {
        archive.file(clip.filePath, { name: filenameInZip });
      }

      const captionContent = `TITLE: ${clip.title} #Shorts\n\nHOOK:\n"${clip.hook}"\n\nCAPTION & HASHTAGS:\n${clip.suggestedCaption}\n\nSCHEDULED FOR: ${clip.scheduledDate || 'Unscheduled'} at ${clip.scheduledTime || '12:00'}\nCHANNELS: ${clip.platforms.join(', ')}\nVIRALITY SCORE: ${clip.viralityScore}/100\n`;
      archive.append(captionContent, { name: txtInZip });

      summaryText += `${clipNumber}. ${clip.title}\n   Scheduled: ${clip.scheduledDate || 'Manual'}\n   File: ${filenameInZip}\n\n`;
    });

    archive.append(summaryText, { name: 'README_PUBLISHING_SCHEDULE.txt' });
    archive.finalize();
  } catch (err: any) {
    console.error('ZIP export failed:', err);
    res.status(500).json({ error: 'ZIP export failed: ' + err.message });
  }
});

// Storage & Google Drive Status
app.get('/api/storage/status', (req, res) => {
  res.json(googleDriveService.getStorageStatus());
});

app.post('/api/storage/google-drive', (req, res) => {
  const updated = googleDriveService.updateConfig(req.body);
  res.json({ success: true, config: updated });
});

// Sync Single Clip to Google Drive
app.post('/api/clips/:id/sync-gdrive', async (req, res) => {
  try {
    const result = await googleDriveService.syncClip(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Google Drive clip sync error:', err);
    res.status(500).json({ error: err.message || 'Failed to sync clip to Google Drive' });
  }
});

// Sync All Approved Clips to Google Drive (Batch)
app.post('/api/clips/sync-gdrive-batch', async (req, res) => {
  try {
    const { clipIds } = req.body;
    const result = await googleDriveService.syncBatch(clipIds);
    res.json(result);
  } catch (err: any) {
    console.error('Google Drive batch sync error:', err);
    res.status(500).json({ error: err.message || 'Batch sync to Google Drive failed' });
  }
});

// Update Clip
app.patch('/api/clips/:id', (req, res) => {
  const clip = db.getClip(req.params.id);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  const updates: Partial<ClipRecord> = { ...req.body };
  if (updates.status === 'approved' && !clip.approvedAt) {
    updates.approvedAt = new Date().toISOString();
  }
  if (updates.status === 'published' && !clip.publishedAt) {
    updates.publishedAt = new Date().toISOString();
  }

  db.updateClip(req.params.id, updates);
  res.json(db.getClip(req.params.id));
});

// Direct YouTube Publishing (Shorts or Standard Videos)
app.post('/api/clips/:id/publish-youtube', async (req, res) => {
  try {
    const clip = db.getClip(req.params.id);
    if (!clip) return res.status(404).json({ error: 'Clip not found' });

    const integrations = db.getIntegrations();
    const ytIntegration = integrations.find(i => i.platform === 'youtube');
    const {
      accessToken,
      privacyStatus = 'public',
      title,
      description,
      tags,
      categoryId
    } = req.body;

    const token = accessToken || (ytIntegration as any)?.accessToken;
    if (!token) {
      return res.status(400).json({
        error: 'YouTube Access Token required. Connect YouTube in Integrations or enter your OAuth access token.'
      });
    }

    const isShort = clip.aspectRatio === '9:16';
    const uploadTitle = title || clip.title;
    const uploadDesc = description || clip.suggestedCaption;

    console.log(`[YouTube Publish] Uploading "${uploadTitle}" to YouTube (${isShort ? 'Shorts' : 'Video'})...`);
    const uploadResult = await youtubeService.uploadVideo({
      filePath: clip.filePath,
      title: uploadTitle,
      description: uploadDesc,
      accessToken: token,
      privacyStatus,
      tags: tags || ['clipgenius', 'trending', isShort ? 'Shorts' : 'video'],
      categoryId: categoryId || '22',
      isShort
    });

    db.updateClip(clip.id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      youtubeVideoUrl: uploadResult.url,
      youtubeVideoId: uploadResult.videoId
    });

    db.addAuditLog('youtube_published', `Uploaded "${uploadTitle}" to YouTube: ${uploadResult.url}`);

    res.json({
      success: true,
      videoId: uploadResult.videoId,
      url: uploadResult.url
    });
  } catch (err: any) {
    console.error('YouTube publish error:', err);
    res.status(500).json({ error: err.message || 'YouTube upload failed' });
  }
});

// Delete Clip
app.delete('/api/clips/:id', (req, res) => {
  const clip = db.getClip(req.params.id);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  if (fs.existsSync(clip.filePath)) {
    try { fs.unlinkSync(clip.filePath); } catch (e) {}
  }

  // Also clean up thumbnail
  if (clip.thumbnailUrl) {
    const thumbPath = path.resolve(process.cwd(), clip.thumbnailUrl.replace(/^\//, ''));
    if (fs.existsSync(thumbPath)) {
      try { fs.unlinkSync(thumbPath); } catch (e) {}
    }
  }

  db.deleteClip(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Storage Garbage Collection (Clean orphan and cache files)
app.post('/api/storage/clean', (req, res) => {
  try {
    const result = db.cleanStorage();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Purge Demo Data
app.post('/api/workspace/purge-demo', (req, res) => {
  try {
    const result = db.purgeDemoData();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full Workspace Reset
app.post('/api/workspace/reset', (req, res) => {
  try {
    db.resetWorkspace();
    res.json({ success: true, message: 'Workspace reset to clean state.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trends Templates
app.get('/api/trends', (req, res) => {
  res.json(db.getTrends());
});

// Integrations
app.get('/api/integrations', (req, res) => {
  res.json(db.getIntegrations());
});

app.post('/api/integrations/:platform', (req, res) => {
  const { platform } = req.params;
  const { channelHandle, apiKey, accessToken, status } = req.body;

  db.updateIntegration(platform, {
    status: status || (channelHandle || apiKey ? 'connected' : 'not_configured'),
    channelHandle: channelHandle || null,
    lastSync: new Date().toISOString(),
    ...(accessToken ? { accessToken } : {})
  } as any);

  res.json(db.getIntegrations().find(i => i.platform === platform));
});

// Settings
app.get('/api/settings', (req, res) => {
  const s = db.getSettings();
  const mask = (k: string) => k ? `${k.slice(0, 4)}...${k.slice(-4)}` : '';
  const masked = {
    ...s,
    geminiApiKey: mask(s.geminiApiKey),
    openaiApiKey: mask(s.openaiApiKey),
    anthropicApiKey: mask(s.anthropicApiKey),
    groqApiKey: mask(s.groqApiKey),
    deepseekApiKey: mask(s.deepseekApiKey),
    customLlmKey: mask(s.customLlmKey),
    elevenLabsApiKey: mask(s.elevenLabsApiKey),
    deepgramApiKey: mask(s.deepgramApiKey),
    pexelsApiKey: mask(s.pexelsApiKey),
    pixabayApiKey: mask(s.pixabayApiKey),
    webhookSecret: mask(s.webhookSecret),
    hasGeminiKey: Boolean(s.geminiApiKey),
    hasOpenAiKey: Boolean(s.openaiApiKey),
    hasAnthropicKey: Boolean(s.anthropicApiKey),
    hasGroqKey: Boolean(s.groqApiKey),
    hasDeepseekKey: Boolean(s.deepseekApiKey),
    hasElevenLabsKey: Boolean(s.elevenLabsApiKey),
    hasDeepgramKey: Boolean(s.deepgramApiKey),
    hasPexelsKey: Boolean(s.pexelsApiKey),
    hasPixabayKey: Boolean(s.pixabayApiKey)
  };
  res.json(masked);
});

app.post('/api/settings', (req, res) => {
  const updates: any = {};
  const isRealKey = (v: any) => typeof v === 'string' && v.trim() !== '' && !v.includes('...');

  // LLM fields
  if (req.body.preferredLlmProvider !== undefined) updates.preferredLlmProvider = req.body.preferredLlmProvider;
  if (req.body.ollamaEndpoint !== undefined) updates.ollamaEndpoint = req.body.ollamaEndpoint;
  if (req.body.customLlmEndpoint !== undefined) updates.customLlmEndpoint = req.body.customLlmEndpoint;
  if (req.body.customLlmModel !== undefined) updates.customLlmModel = req.body.customLlmModel;

  if (isRealKey(req.body.geminiApiKey)) updates.geminiApiKey = req.body.geminiApiKey.trim();
  if (isRealKey(req.body.openaiApiKey)) updates.openaiApiKey = req.body.openaiApiKey.trim();
  if (isRealKey(req.body.anthropicApiKey)) updates.anthropicApiKey = req.body.anthropicApiKey.trim();
  if (isRealKey(req.body.groqApiKey)) updates.groqApiKey = req.body.groqApiKey.trim();
  if (isRealKey(req.body.deepseekApiKey)) updates.deepseekApiKey = req.body.deepseekApiKey.trim();
  if (isRealKey(req.body.customLlmKey)) updates.customLlmKey = req.body.customLlmKey.trim();

  // TTS fields
  if (req.body.preferredTtsProvider !== undefined) updates.preferredTtsProvider = req.body.preferredTtsProvider;
  if (req.body.elevenLabsVoiceId !== undefined) updates.elevenLabsVoiceId = req.body.elevenLabsVoiceId;
  if (req.body.openaiTtsVoice !== undefined) updates.openaiTtsVoice = req.body.openaiTtsVoice;
  if (isRealKey(req.body.elevenLabsApiKey)) updates.elevenLabsApiKey = req.body.elevenLabsApiKey.trim();
  if (isRealKey(req.body.deepgramApiKey)) updates.deepgramApiKey = req.body.deepgramApiKey.trim();

  // Media fields
  if (req.body.mediaStyle !== undefined) updates.mediaStyle = req.body.mediaStyle;
  if (isRealKey(req.body.pexelsApiKey)) updates.pexelsApiKey = req.body.pexelsApiKey.trim();
  if (isRealKey(req.body.pixabayApiKey)) updates.pixabayApiKey = req.body.pixabayApiKey.trim();

  // Webhook fields
  if (req.body.webhookUrl !== undefined) updates.webhookUrl = req.body.webhookUrl;
  if (req.body.webhookEnabled !== undefined) updates.webhookEnabled = req.body.webhookEnabled;
  if (isRealKey(req.body.webhookSecret)) updates.webhookSecret = req.body.webhookSecret.trim();

  // Storage & Google Drive fields
  if (req.body.storageProvider !== undefined) updates.storageProvider = req.body.storageProvider;
  if (req.body.googleDriveFolderName !== undefined) updates.googleDriveFolderName = req.body.googleDriveFolderName;
  if (req.body.googleDriveFolderUrl !== undefined) {
    updates.googleDriveFolderUrl = req.body.googleDriveFolderUrl;
    const match = req.body.googleDriveFolderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match) updates.googleDriveFolderId = match[1];
  }
  if (req.body.googleDriveFolderId !== undefined) updates.googleDriveFolderId = req.body.googleDriveFolderId;
  if (req.body.googleDriveAutoSync !== undefined) updates.googleDriveAutoSync = req.body.googleDriveAutoSync;
  if (req.body.googleDriveConnected !== undefined) updates.googleDriveConnected = req.body.googleDriveConnected;

  // General fields
  if (req.body.customDomain !== undefined) updates.customDomain = req.body.customDomain;
  if (req.body.defaultAspectRatio !== undefined) updates.defaultAspectRatio = req.body.defaultAspectRatio;
  if (req.body.autoApproveHighVirality !== undefined) updates.autoApproveHighVirality = req.body.autoApproveHighVirality;

  db.updateSettings(updates);
  db.addAuditLog('settings_updated', 'Updated API configuration and credentials.');
  res.json({ success: true, message: 'Settings saved successfully.' });
});

// Test LLM Connection
app.post('/api/settings/test-llm', async (req, res) => {
  try {
    const text = await aiService.generateText('Confirm connection in 5 words.');
    if (text) {
      res.json({ success: true, response: text });
    } else {
      res.status(400).json({ success: false, error: 'No response from configured LLM provider. Check your API key.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test TTS Audio Generation
app.post('/api/settings/test-tts', async (req, res) => {
  try {
    const result = await ttsService.generateSpeech('This is a test of your configured voice narration engine.', 'test-tts.mp3');
    res.json({ success: true, provider: result.provider, duration: result.duration, url: '/uploads/audio/test-tts.mp3' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test Stock Media Search
app.post('/api/settings/test-media', async (req, res) => {
  try {
    const topic = req.body.topic || 'technology';
    const filePath = await stockMediaService.fetchBackgroundVideo(topic, 10);
    if (filePath) {
      const relPath = filePath.replace(uploadsDir, '/uploads').replace(/\\/g, '/');
      res.json({ success: true, message: `Successfully fetched vertical footage for "${topic}"`, url: relPath });
    } else {
      res.json({ success: false, message: 'No stock footage API configured or no matching vertical clip found. Using dynamic motion canvas fallback.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test Webhook Dispatch
app.post('/api/settings/test-webhook', async (req, res) => {
  try {
    const ok = await webhookService.dispatch('clip.generated', {
      test: true,
      message: 'Test ping from ClipGenius AI Automation Engine',
      timestamp: new Date().toISOString()
    });
    if (ok) {
      res.json({ success: true, message: 'Webhook test ping received 200 OK from endpoint!' });
    } else {
      res.status(400).json({ success: false, error: 'Webhook endpoint did not respond with 2xx. Verify URL and server.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[ClipGenius AI Backend] Server running on http://localhost:${PORT}`);
});
