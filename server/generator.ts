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
        cmd = `ffmpeg -y -stream_loop -1 -i "${escapedStockPath}" -i "${escapedAudioPath}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness=-0.12:contrast=1.05,drawbox=x=80:y=200:w=920:h=6:color=#2563EB@0.8:t=fill,drawtext=text='TREND ALERT':x=(w-text_w)/2:y=120:fontsize=36:fontcolor=#93C5FD:font='Arial':box=1:boxcolor=#1E293B@0.8:boxborderw=10,ass='${escapedSubPath}'" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;
      } else {
        // Dynamic Canvas Slate mode: 1080x1920 gradient, banner, burned subtitles, voiceover audio
        cmd = `ffmpeg -y -f lavfi -i "color=c=#0B1220:s=1080x1920:d=${duration}" -i "${escapedAudioPath}" -t ${duration} -vf "drawbox=x=80:y=200:w=920:h=6:color=#2563EB@0.8:t=fill,drawtext=text='TREND ALERT':x=(w-text_w)/2:y=120:fontsize=36:fontcolor=#93C5FD:font='Arial':box=1:boxcolor=#1E293B@0.8:boxborderw=10,ass='${escapedSubPath}'" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;
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
}

export const trendVideoGenerator = new TrendVideoGenerator();
