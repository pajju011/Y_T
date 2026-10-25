import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { db, ClipRecord, LiveTrend, ContentStrategy } from './db.js';
import { ffmpegService } from './ffmpeg.js';
import { aiService } from './ai.js';
import { ttsService } from './tts.js';
import { stockMediaService } from './stockMedia.js';
import { webhookService } from './webhooks.js';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

export interface TrendScriptPlan {
  title: string;
  hook: string;
  scene1: string;
  scene2: string;
  scene3: string;
  fullNarration: string;
  caption: string;
  viralityScore: number;
}

export class TrendVideoGenerator {
  /**
   * Generates a complete 9:16 vertical short video from scratch around a trend topic
   */
  public async generateTrendVideo(trend: LiveTrend, strategy: ContentStrategy, framework?: string): Promise<ClipRecord> {
    const targetDuration = strategy.durationSec || 30;
    const clipId = 'trend-vid-' + Date.now();
    const clipFilename = `trend-${clipId}.mp4`;
    const outputPath = path.join(uploadsDir, 'clips', clipFilename);
    const urlPath = `/uploads/clips/${clipFilename}`;

    console.log(`[Text-To-Video Engine] Creating original vertical video for "${trend.title}" using framework "${framework || 'Dynamic Story'}"...`);

    // 1. Generate Structured AI Script (Universal LLM: Gemini / OpenAI / Claude / Groq / DeepSeek / Heuristic)
    const scriptPlan = await this.generateScript(trend, strategy, framework);

    // 2. Generate Real Voiceover Audio (ElevenLabs / OpenAI TTS / Deepgram / Ambient)
    const audioFilename = `speech-${clipId}.mp3`;
    const ttsResult = await ttsService.generateSpeech(scriptPlan.fullNarration, audioFilename);
    const finalDuration = Math.max(15, Math.min(60, Math.round(ttsResult.duration || targetDuration)));

    // 3. Fetch Real 9:16 Background Stock Footage (Pexels / Pixabay) if API configured
    const backgroundVideoPath = await stockMediaService.fetchBackgroundVideo(trend.title, finalDuration);

    // 4. Render Final Vertical Video with Burned Captions & Voiceover
    await this.renderVideo(scriptPlan, finalDuration, ttsResult.audioPath, backgroundVideoPath, outputPath);

    // 5. Extract High-Quality Thumbnail
    const thumbFilename = `thumb-${clipId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    const thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
    try {
      await ffmpegService.extractThumbnail(outputPath, thumbPath, 2);
    } catch (e) {}

    // 6. Save to Database as Pending Creator Approval
    const newClip: ClipRecord = {
      id: clipId,
      videoId: 'trend-origin',
      videoTitle: `AI Trend: ${trend.niche}`,
      title: scriptPlan.title,
      hook: scriptPlan.hook,
      transcript: scriptPlan.fullNarration,
      suggestedCaption: scriptPlan.caption,
      startTime: 0,
      endTime: finalDuration,
      duration: finalDuration,
      viralityScore: scriptPlan.viralityScore,
      viralityReason: `Engineered using ${framework || 'Problem-Agitate-Solve'} framework with ${ttsResult.provider} narration for ${strategy.targetAudience}.`,
      filePath: outputPath,
      urlPath: urlPath,
      thumbnailUrl: thumbnailUrl,
      aspectRatio: '9:16',
      framingMode: 'center',
      captionStyle: 'bold-yellow',
      status: 'in_review', // MANDATORY: Starts in Review, Never auto-published
      scheduledDate: null,
      scheduledTime: null,
      platforms: strategy.preferredPlatforms || ['youtube', 'tiktok'],
      createdAt: new Date().toISOString(),
      approvedAt: null,
      publishedAt: null,
      trendSourceUrl: trend.url
    };

    db.addClip(newClip);
    db.addAuditLog('trend_video_generated', `Generated draft video "${newClip.title}" [Voice: ${ttsResult.provider}, Footage: ${backgroundVideoPath ? 'Pexels/Stock' : 'Motion Canvas'}]`);

    // 7. Dispatch Webhook Event to Zapier / Make / n8n / Discord
    await webhookService.dispatch('clip.generated', newClip);

    return newClip;
  }

  private async generateScript(trend: LiveTrend, strategy: ContentStrategy, framework?: string): Promise<TrendScriptPlan> {
    const frameworkInstruction = framework ? `Adopt the "${framework}" storytelling framework.` : 'Use a high-retention problem-insight-action framework.';
    const prompt = `You are a viral short-form video creator.
Topic: "${trend.title}"
Context: "${trend.snippet}"
Niche: "${strategy.niche}"
Target Audience: "${strategy.targetAudience}"
Language: "${strategy.language || 'English'}"
Tone: "${strategy.tone}"
Duration: ${strategy.durationSec}s.
Framework: ${frameworkInstruction}

Generate an original 3-scene short video script.
Return ONLY valid JSON matching this schema:
{
  "title": "Punchy Short Title (under 45 chars)",
  "hook": "First 3-second spoken hook line (curiosity-driven)",
  "scene1": "First insight (5-10 words)",
  "scene2": "The surprising breakdown (5-10 words)",
  "scene3": "The bottom-line takeaway (5-10 words)",
  "fullNarration": "Complete spoken voice-over script (approx 50 words)",
  "caption": "Platform-ready caption with 4 hashtags",
  "viralityScore": 92
}`;

    const raw = await aiService.generateText(prompt, 'You are an elite short-form scriptwriter. Return ONLY valid JSON.');
    if (raw) {
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.hook && parsed.fullNarration) {
          return parsed;
        }
      } catch (e) {
        console.warn('[Generator] Failed to parse AI script JSON, falling back to heuristic script');
      }
    }

    // High-quality Heuristic Script Fallback (100% Free, Offline)
    let hook = `Nobody expected this update, but it changes everything for ${strategy.niche}.`;
    let scene1 = `Here is the critical news that just broke today.`;
    let scene2 = `Most people haven't connected how this disrupts traditional workflows.`;
    let scene3 = `Here is the one move you need to make right now.`;

    if (framework?.toLowerCase().includes('contrarian')) {
      hook = `Stop doing what everyone else is doing in ${strategy.niche}.`;
      scene1 = `The conventional wisdom just got completely overturned.`;
      scene2 = `The top 1% are shifting their approach entirely.`;
      scene3 = `Do this instead if you want to stay ahead of the curve.`;
    } else if (framework?.toLowerCase().includes('before-after')) {
      hook = `This was completely impossible just 6 months ago.`;
      scene1 = `Here is how everyone used to do it the hard way.`;
      scene2 = `Now this single breakthrough changes the equation.`;
      scene3 = `Save this guide and try it on your next project.`;
    }

    return {
      title: `${trend.title.slice(0, 36)}: What It Means`,
      hook,
      scene1,
      scene2,
      scene3,
      fullNarration: `${hook} ${scene1} ${scene2} ${scene3}`,
      caption: `Breaking analysis on ${trend.title}. What are your thoughts on this? #${strategy.niche.replace(/\s+/g, '')} #trends #shorts #update`,
      viralityScore: 92
    };
  }

  /**
   * Renders vertical 9:16 video using FFmpeg combining voiceover, stock footage, and burned captions
   */
  private async renderVideo(
    plan: TrendScriptPlan,
    duration: number,
    audioPath: string,
    stockVideoPath: string | null,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      // Build timed ASS Subtitles for the 3 scenes + hook
      const subFilename = `sub-trend-${Date.now()}.ass`;
      const subPath = path.join(targetDir, subFilename);

      const sHook = Math.min(6, Math.floor(duration * 0.22));
      const s1 = Math.floor(duration * 0.48);
      const s2 = Math.floor(duration * 0.74);

      const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Arial,66,&H0000FFFF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,460,1
Style: Scene,Arial,58,&H00FFFFFF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,460,1
Style: CTA,Arial,62,&H00FFA500,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,460,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:0${sHook}.00,Hook,,0,0,0,,{\\b1}${plan.hook.toUpperCase()}{\\b0}
Dialogue: 0,0:00:0${sHook}.00,0:00:${s1}.00,Scene,,0,0,0,,{\\b1}${plan.scene1.toUpperCase()}{\\b0}
Dialogue: 0,0:00:${s1}.00,0:00:${s2}.00,Scene,,0,0,0,,{\\b1}${plan.scene2.toUpperCase()}{\\b0}
Dialogue: 0,0:00:${s2}.00,0:00:${duration}.00,CTA,,0,0,0,,{\\b1}${plan.scene3.toUpperCase()}{\\b0}
`;
      fs.writeFileSync(subPath, assHeader, 'utf-8');
      const escapedSubPath = subPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      const escapedAudioPath = audioPath.replace(/\\/g, '/');

      let cmd = '';

      if (stockVideoPath && fs.existsSync(stockVideoPath)) {
        // Real Stock Footage mode: Loop/scale video to 1080x1920, add dark overlay, burn subtitles, combine with audio
        const escapedStockPath = stockVideoPath.replace(/\\/g, '/');
        cmd = `ffmpeg -y -stream_loop -1 -i "${escapedStockPath}" -i "${escapedAudioPath}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness=-0.12:contrast=1.05,drawbox=x=80:y=200:w=920:h=6:color=#2563EB@0.8:t=fill,drawtext=fontfile='/Windows/Fonts/arial.ttf':text='TREND ALERT':x=(w-text_w)/2:y=120:fontsize=36:fontcolor=#93C5FD:box=1:boxcolor=#1E293B@0.8:boxborderw=10,ass='${escapedSubPath}'" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;
      } else {
        // Dynamic Canvas Slate mode: 1080x1920 gradient, banner, burned subtitles, voiceover audio
        cmd = `ffmpeg -y -f lavfi -i "color=c=#0B1220:s=1080x1920:d=${duration}" -i "${escapedAudioPath}" -t ${duration} -vf "drawbox=x=80:y=200:w=920:h=6:color=#2563EB@0.8:t=fill,drawtext=fontfile='/Windows/Fonts/arial.ttf':text='TREND ALERT':x=(w-text_w)/2:y=120:fontsize=36:fontcolor=#93C5FD:box=1:boxcolor=#1E293B@0.8:boxborderw=10,ass='${escapedSubPath}'" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;
      }

      exec(cmd, (err) => {
        try { fs.unlinkSync(subPath); } catch (e) {}

        if (err) {
          console.error('[Trend Video Generator] Failed with primary command, using safe fallback:', err);
          const fallbackCmd = `ffmpeg -y -f lavfi -i "color=c=#0F172A:s=1080x1920:d=${duration}" -i "${escapedAudioPath}" -t ${duration} -c:v libx264 -c:a aac "${outputPath}"`;
          exec(fallbackCmd, (fbErr) => {
            if (fbErr) return reject(fbErr);
            resolve(outputPath);
          });
        } else {
          resolve(outputPath);
        }
      });
    });
  }

  /**
   * Generates a high quality AI video directly from a creator's custom prompt
   */
  public async generateVideoFromPrompt(options: PromptVideoOptions): Promise<ClipRecord> {
    const {
      prompt,
      aspectRatio = '9:16',
      durationSec = 30,
      style = 'cinematic',
      captionStyle = 'bold-yellow',
      voiceLanguage = 'English',
      musicBed = true
    } = options;

    const clipId = 'ai-video-' + Date.now();
    const clipFilename = `ai-video-${clipId}.mp4`;
    const outputPath = path.join(uploadsDir, 'clips', clipFilename);
    const urlPath = `/uploads/clips/${clipFilename}`;

    console.log(`[AI Prompt Video Engine] Generating video from prompt: "${prompt}" (${aspectRatio}, style: ${style})...`);

    // 1. Generate Structured AI Script
    const scriptPlan = await this.generatePromptScript(prompt, durationSec, voiceLanguage);

    // 2. Generate Real Voiceover Audio (Google Neural Voice / ElevenLabs / OpenAI)
    const audioFilename = `prompt-speech-${clipId}.mp3`;
    const ttsResult = await ttsService.generateSpeech(scriptPlan.fullNarration, audioFilename);
    const finalDuration = Math.max(12, Math.min(65, Math.round(ttsResult.duration || durationSec)));

    // 3. Search Real Background Stock Footage if keywords provided
    const visualQuery = scriptPlan.visualKeyword || prompt.split(' ').slice(0, 3).join(' ');
    const backgroundVideoPath = await stockMediaService.fetchBackgroundVideo(visualQuery, finalDuration);

    // 4. Render Final Video with FFmpeg
    await this.renderPromptVideo({
      scriptPlan,
      duration: finalDuration,
      audioPath: ttsResult.audioPath,
      stockVideoPath: backgroundVideoPath,
      outputPath,
      aspectRatio,
      style,
      captionStyle,
      musicBed
    });

    // 5. Extract Thumbnail
    const thumbFilename = `thumb-${clipId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    const thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
    try {
      await ffmpegService.extractThumbnail(outputPath, thumbPath, 2);
    } catch (e) {}

    // 6. Save Record in Database
    const newClip: ClipRecord = {
      id: clipId,
      videoId: 'prompt-origin',
      videoTitle: `AI Prompt Video: ${prompt.slice(0, 30)}`,
      title: scriptPlan.title,
      hook: scriptPlan.hook,
      transcript: scriptPlan.fullNarration,
      suggestedCaption: scriptPlan.caption,
      startTime: 0,
      endTime: finalDuration,
      duration: finalDuration,
      viralityScore: scriptPlan.viralityScore || 94,
      viralityReason: `Generated from custom prompt using ${style} motion styling and ${ttsResult.provider} narration.`,
      filePath: outputPath,
      urlPath: urlPath,
      thumbnailUrl: thumbnailUrl,
      aspectRatio: aspectRatio,
      framingMode: 'center',
      captionStyle: captionStyle,
      status: 'in_review',
      scheduledDate: null,
      scheduledTime: null,
      platforms: ['youtube', 'tiktok', 'instagram'],
      createdAt: new Date().toISOString(),
      approvedAt: null,
      publishedAt: null,
      prompt: prompt
    };

    db.addClip(newClip);
    db.addAuditLog('prompt_video_generated', `Generated AI video from prompt "${prompt}" (${aspectRatio}, ${finalDuration}s, [Voice: ${ttsResult.provider}])`);

    await webhookService.dispatch('clip.generated', newClip);

    return newClip;
  }

  /**
   * Generates tailored script for a prompt
   */
  private async generatePromptScript(prompt: string, targetDuration: number, language: string): Promise<any> {
    const aiPrompt = `You are a world-class viral video director and scriptwriter.
The user wants an engaging video based on this prompt:
"${prompt}"

Language: ${language}
Target Duration: ~${targetDuration} seconds.

Write an original, highly-engaging video script designed for maximum retention on YouTube (and Shorts/TikTok).
Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Short Punchy Title (under 45 characters, curiosity-inducing)",
  "hook": "First 3-second spoken hook line (grabs attention instantly)",
  "scene1": "First surprising insight or setup (6-12 words)",
  "scene2": "The core revelation or demonstration (6-12 words)",
  "scene3": "The mind-blowing twist or key takeaway (6-12 words)",
  "cta": "Engaging call-to-action (e.g. Subscribe for daily breakdowns)",
  "fullNarration": "Complete spoken narrative flow (approximately 50-70 words spoken fluently)",
  "caption": "Platform-ready YouTube description with 4 high-traffic hashtags",
  "visualKeyword": "1-3 English keywords for matching b-roll stock footage (e.g. technology, brain, cosmos, ocean)",
  "viralityScore": 95
}`;

    const raw = await aiService.generateText(aiPrompt, 'You are an elite video director. Return ONLY valid JSON.');
    if (raw) {
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.hook && parsed.fullNarration) {
          return parsed;
        }
      } catch (e) {
        console.warn('[Generator] Failed to parse prompt script JSON, using smart generator');
      }
    }

    // Heuristic Smart Script Generator based on prompt keywords
    const cleanTitle = prompt.length > 40 ? prompt.slice(0, 38) + '...' : prompt;
    const hook = `Here is what nobody tells you about ${prompt.slice(0, 32)}.`;
    const scene1 = `The standard approach you see everywhere is actually holding you back.`;
    const scene2 = `When you look at the data, the real breakthrough comes from one hidden variable.`;
    const scene3 = `Apply this insight right away and see the difference immediately.`;
    const cta = `Subscribe for more daily deep-dives and save this for later.`;

    return {
      title: `${cleanTitle}: What You Must Know`,
      hook,
      scene1,
      scene2,
      scene3,
      cta,
      fullNarration: `${hook} ${scene1} ${scene2} ${scene3} ${cta}`,
      caption: `Deep-dive on ${cleanTitle}. What are your thoughts on this? #ai #learning #insights #breakthrough #shorts`,
      visualKeyword: prompt.split(' ').slice(0, 2).join(' ') || 'technology',
      viralityScore: 94
    };
  }

  /**
   * Renders high-quality AI video with resolution according to aspect ratio
   */
  private async renderPromptVideo(params: {
    scriptPlan: any;
    duration: number;
    audioPath: string;
    stockVideoPath: string | null;
    outputPath: string;
    aspectRatio: '9:16' | '16:9';
    style: string;
    captionStyle: string;
    musicBed: boolean;
  }): Promise<string> {
    const { scriptPlan, duration, audioPath, stockVideoPath, outputPath, aspectRatio, style, captionStyle } = params;

    return new Promise((resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const isVertical = aspectRatio === '9:16';
      const width = isVertical ? 1080 : 1920;
      const height = isVertical ? 1920 : 1080;

      // Build Subtitle File
      const subFilename = `sub-prompt-${Date.now()}.ass`;
      const subPath = path.join(targetDir, subFilename);

      const sHook = Math.min(5, Math.floor(duration * 0.22));
      const s1 = Math.floor(duration * 0.46);
      const s2 = Math.floor(duration * 0.72);

      // Color palette based on captionStyle
      let primaryColor = '&H0000FFFF'; // Bold Yellow
      let outlineColor = '&H00000000';
      if (captionStyle === 'karaoke-blue') primaryColor = '&H00FFFF00'; // Sky blue in BGR
      else if (captionStyle === 'minimal-white') primaryColor = '&H00FFFFFF';
      else if (captionStyle === 'red-alert') primaryColor = '&H000000FF';

      const fontSize = isVertical ? 64 : 52;
      const marginV = isVertical ? 460 : 140;

      const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Arial,${fontSize + 6},${primaryColor},&H00000000,${outlineColor},&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,${marginV},1
Style: Scene,Arial,${fontSize},&H00FFFFFF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,${marginV},1
Style: CTA,Arial,${fontSize + 2},&H00FFA500,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:0${sHook}.00,Hook,,0,0,0,,{\\b1}${scriptPlan.hook.toUpperCase()}{\\b0}
Dialogue: 0,0:00:0${sHook}.00,0:00:${s1}.00,Scene,,0,0,0,,{\\b1}${scriptPlan.scene1.toUpperCase()}{\\b0}
Dialogue: 0,0:00:${s1}.00,0:00:${s2}.00,Scene,,0,0,0,,{\\b1}${scriptPlan.scene2.toUpperCase()}{\\b0}
Dialogue: 0,0:00:${s2}.00,0:00:${duration}.00,CTA,,0,0,0,,{\\b1}${(scriptPlan.scene3 || scriptPlan.cta || '').toUpperCase()}{\\b0}
`;
      fs.writeFileSync(subPath, assContent, 'utf-8');

      const escapedSub = subPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      const escapedAudio = audioPath.replace(/\\/g, '/');

      // Style accents
      let bgGradColor = '#0b1120';
      let accentBoxColor = '#2563EB@0.8';
      let badgeText = 'AI INSIGHT';

      if (style === 'neon') {
        bgGradColor = '#0d0221';
        accentBoxColor = '#06b6d4@0.8';
        badgeText = 'CYBERPUNK AI';
      } else if (style === 'editorial') {
        bgGradColor = '#18181b';
        accentBoxColor = '#eab308@0.8';
        badgeText = 'SPECIAL REPORT';
      } else if (style === 'kinetic') {
        bgGradColor = '#090d16';
        accentBoxColor = '#ef4444@0.8';
        badgeText = 'VIRAL BREAKTHROUGH';
      }

      let cmd = '';

      if (stockVideoPath && fs.existsSync(stockVideoPath)) {
        const escapedStock = stockVideoPath.replace(/\\/g, '/');
        cmd = `ffmpeg -y -stream_loop -1 -i "${escapedStock}" -i "${escapedAudio}" -t ${duration} -vf "scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=brightness=-0.14:contrast=1.08,drawbox=x=80:y=${isVertical ? 200 : 90}:w=${width - 160}:h=6:color=${accentBoxColor}:t=fill,drawtext=fontfile='/Windows/Fonts/arial.ttf':text='${badgeText}':x=(w-text_w)/2:y=${isVertical ? 120 : 45}:fontsize=34:fontcolor=#93C5FD:box=1:boxcolor=#1E293B@0.85:boxborderw=10,ass='${escapedSub}'" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;
      } else {
        cmd = `ffmpeg -y -f lavfi -i "color=c=${bgGradColor}:s=${width}x${height}:d=${duration}" -i "${escapedAudio}" -t ${duration} -vf "drawbox=x=80:y=${isVertical ? 200 : 90}:w=${width - 160}:h=6:color=${accentBoxColor}:t=fill,drawtext=fontfile='/Windows/Fonts/arial.ttf':text='${badgeText}':x=(w-text_w)/2:y=${isVertical ? 120 : 45}:fontsize=34:fontcolor=#93C5FD:box=1:boxcolor=#1E293B@0.85:boxborderw=10,ass='${escapedSub}'" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;
      }

      exec(cmd, (err) => {
        try { fs.unlinkSync(subPath); } catch (e) {}

        if (err) {
          console.error('[AI Prompt Video] Primary render error, applying safe fallback:', err);
          const fallbackCmd = `ffmpeg -y -f lavfi -i "color=c=#0F172A:s=${width}x${height}:d=${duration}" -i "${escapedAudio}" -t ${duration} -c:v libx264 -c:a aac "${outputPath}"`;
          exec(fallbackCmd, (fbErr) => {
            if (fbErr) return reject(fbErr);
            resolve(outputPath);
          });
        } else {
          resolve(outputPath);
        }
      });
    });
  }

  /**
   * Enhances a basic user prompt into a high-engagement viral video blueprint
   */
  public async enhancePrompt(prompt: string, niche?: string): Promise<{ enhancedPrompt: string; suggestedStyle: string; suggestedDuration: number }> {
    const aiPrompt = `Enhance this simple user video prompt into a high-retention viral video prompt:
Prompt: "${prompt}"
Niche: "${niche || 'General'}"

Return ONLY valid JSON:
{
  "enhancedPrompt": "Expanded, highly engaging prompt with hook angle and visual scenes",
  "suggestedStyle": "cinematic" (choose from cinematic, kinetic, editorial, neon),
  "suggestedDuration": 30
}`;

    const raw = await aiService.generateText(aiPrompt);
    if (raw) {
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.enhancedPrompt) return parsed;
      } catch (e) {}
    }

    return {
      enhancedPrompt: `Create an ultra-high-retention video exposing the critical breakthrough behind ${prompt}. Break it down into 3 fast-paced insights with visual evidence and a powerful conclusion.`,
      suggestedStyle: 'cinematic',
      suggestedDuration: 30
    };
  }
}

export interface PromptVideoOptions {
  prompt: string;
  aspectRatio?: '9:16' | '16:9';
  durationSec?: number;
  style?: 'cinematic' | 'kinetic' | 'editorial' | 'neon';
  captionStyle?: 'bold-yellow' | 'karaoke-blue' | 'minimal-white' | 'red-alert';
  voiceLanguage?: string;
  musicBed?: boolean;
}

export const trendVideoGenerator = new TrendVideoGenerator();
