import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ZipArchive } from 'archiver';
import { db, VideoRecord, ClipRecord } from './db.js';
import { ffmpegService, FramingMode, AspectRatio, CaptionStyle } from './ffmpeg.js';
import { aiService } from './ai.js';
import { youtubeService } from './youtube.js';

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
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
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
  res.json({
    ffmpeg: ffmpegStatus,
    activeAiProvider: settings.geminiApiKey ? 'Google Gemini 2.0 Flash' : 'Built-in Local Pattern Engine (100% Free)',
    customDomain: settings.customDomain || 'Not configured (runs locally on localhost:5173)',
    timestamp: new Date().toISOString()
  });
});

// Real Metrics
app.get('/api/metrics', (req, res) => {
  const metrics = db.getMetrics();
  res.json(metrics);
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

// Import Video from YouTube URL (Upgrade A: yt-dlp)
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

// Cut Clip with FFmpeg (Upgrades B & C: Burned Subtitles & Smart Framing)
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

    // Execute advanced cut with Framing and permanently burned ASS subtitles
    await ffmpegService.cutVerticalClip(video.filePath, outputPath, {
      startTime: startSec,
      duration: clipDuration,
      aspectRatio: aspectRatio as AspectRatio,
      framingMode: framingMode as FramingMode,
      captionStyle: captionStyle as CaptionStyle,
      hookText: hook || title
    });

    // Extract thumbnail
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

// Batch ZIP Export (Upgrade D: 1-Click ZIP of all approved clips)
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

// Direct YouTube Shorts Publishing (Upgrade E: 1-Click OAuth Upload)
app.post('/api/clips/:id/publish-youtube', async (req, res) => {
  try {
    const clip = db.getClip(req.params.id);
    if (!clip) return res.status(404).json({ error: 'Clip not found' });

    const integrations = db.getIntegrations();
    const ytIntegration = integrations.find(i => i.platform === 'youtube');
    const { accessToken, privacyStatus = 'public' } = req.body;

    const token = accessToken || (ytIntegration as any)?.accessToken;
    if (!token) {
      return res.status(400).json({
        error: 'YouTube Access Token required. Connect YouTube in Integrations or provide an access token.'
      });
    }

    console.log(`[YouTube Publish] Uploading "${clip.title}" to YouTube Shorts...`);
    const uploadResult = await youtubeService.uploadShort({
      filePath: clip.filePath,
      title: clip.title,
      description: clip.suggestedCaption,
      accessToken: token,
      privacyStatus
    });

    db.updateClip(clip.id, {
      status: 'published',
      publishedAt: new Date().toISOString()
    });

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

  db.deleteClip(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Trends
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
  const settings = db.getSettings();
  const masked = {
    ...settings,
    geminiApiKey: settings.geminiApiKey ? `${settings.geminiApiKey.slice(0, 4)}...${settings.geminiApiKey.slice(-4)}` : '',
    groqApiKey: settings.groqApiKey ? `${settings.groqApiKey.slice(0, 4)}...${settings.groqApiKey.slice(-4)}` : '',
    hasGeminiKey: Boolean(settings.geminiApiKey),
    hasGroqKey: Boolean(settings.groqApiKey)
  };
  res.json(masked);
});

app.post('/api/settings', (req, res) => {
  const updates: any = {};

  if (req.body.customDomain !== undefined) updates.customDomain = req.body.customDomain;
  if (req.body.defaultAspectRatio !== undefined) updates.defaultAspectRatio = req.body.defaultAspectRatio;
  if (req.body.autoApproveHighVirality !== undefined) updates.autoApproveHighVirality = req.body.autoApproveHighVirality;
  if (req.body.ollamaEndpoint !== undefined) updates.ollamaEndpoint = req.body.ollamaEndpoint;

  if (req.body.geminiApiKey && !req.body.geminiApiKey.includes('...')) {
    updates.geminiApiKey = req.body.geminiApiKey;
  }
  if (req.body.groqApiKey && !req.body.groqApiKey.includes('...')) {
    updates.groqApiKey = req.body.groqApiKey;
  }

  db.updateSettings(updates);
  res.json({ success: true, message: 'Settings saved successfully.' });
});

app.listen(PORT, () => {
  console.log(`[ClipGenius AI Backend] Server running on http://localhost:${PORT}`);
});
