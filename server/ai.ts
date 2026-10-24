import { db, VideoRecord } from './db.js';
import { ffmpegService } from './ffmpeg.js';

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

export class AIService {
  /**
   * Universal completion router supporting Gemini, OpenAI, Claude, Groq, DeepSeek, Ollama, & Custom API
   */
  public async generateText(prompt: string, systemPrompt?: string): Promise<string | null> {
    const settings = db.getSettings();

    // 1. Google Gemini
    if (settings.geminiApiKey && settings.geminiApiKey.trim() !== '') {
      try {
        console.log('[AI] Generating text with Google Gemini...');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiApiKey.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: (systemPrompt ? systemPrompt + '\n\n' : '') + prompt }] }]
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (e: any) {
        console.warn('[AI] Gemini call failed:', e.message);
      }
    }

    // 2. OpenAI (GPT-4o / GPT-4o-mini)
    if (settings.openaiApiKey && settings.openaiApiKey.trim() !== '') {
      try {
        console.log('[AI] Generating text with OpenAI...');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.openaiApiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        }
      } catch (e: any) {
        console.warn('[AI] OpenAI call failed:', e.message);
      }
    }

    // 3. Groq (Llama 3.3 70B - Ultra Fast)
    if (settings.groqApiKey && settings.groqApiKey.trim() !== '') {
      try {
        console.log('[AI] Generating text with Groq...');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.groqApiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ]
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        }
      } catch (e: any) {
        console.warn('[AI] Groq call failed:', e.message);
      }
    }

    // 4. Anthropic Claude
    if (settings.anthropicApiKey && settings.anthropicApiKey.trim() !== '') {
      try {
        console.log('[AI] Generating text with Anthropic Claude...');
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.anthropicApiKey.trim(),
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
            system: systemPrompt
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.content?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (e: any) {
        console.warn('[AI] Anthropic call failed:', e.message);
      }
    }

    // 5. DeepSeek
    if (settings.deepseekApiKey && settings.deepseekApiKey.trim() !== '') {
      try {
        console.log('[AI] Generating text with DeepSeek...');
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.deepseekApiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ]
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        }
      } catch (e: any) {
        console.warn('[AI] DeepSeek call failed:', e.message);
      }
    }

    // 6. Custom OpenAI-Compatible Endpoint
    if (settings.customLlmEndpoint && settings.customLlmEndpoint.trim() !== '') {
      try {
        console.log('[AI] Generating text with Custom LLM Endpoint...');
        const url = settings.customLlmEndpoint.replace(/\/+$/, '') + '/chat/completions';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (settings.customLlmKey) headers['Authorization'] = `Bearer ${settings.customLlmKey.trim()}`;

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: settings.customLlmModel || 'default',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ]
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        }
      } catch (e: any) {
        console.warn('[AI] Custom LLM call failed:', e.message);
      }
    }

    return null;
  }

  public async analyzeVideo(video: VideoRecord, targetDurationSec: number = 30): Promise<HighlightCandidate[]> {
    let speechIntervals: { start: number; end: number }[] = [];
    let chapters: { title: string; start: number; end: number }[] = [];

    try {
      [speechIntervals, chapters] = await Promise.all([
        ffmpegService.detectSpeechIntervals(video.filePath, video.duration).catch(() => []),
        ffmpegService.getChapters(video.filePath).catch(() => [])
      ]);
    } catch (e) {
      console.warn('[AI Analysis] Speech/chapter extraction notice:', e);
    }

    const chapterContext = chapters.length > 0
      ? `\nVideo Chapters Detected:\n${chapters.map(c => `- "${c.title}" (${c.start.toFixed(1)}s - ${c.end.toFixed(1)}s)`).join('\n')}`
      : '';

    const speechContext = speechIntervals.length > 0
      ? `\nActive Spoken Segments: ${speechIntervals.slice(0, 8).map(s => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s]`).join(', ')}`
      : '';

    const prompt = `Analyze this video titled "${video.title}" with duration ${video.duration} seconds.${chapterContext}${speechContext}
Suggest 3 high-retention short-form video clips (target duration: ~${targetDurationSec} seconds each) suitable for YouTube Shorts and TikTok.
Align clip start and end times to the active spoken segments so cuts do not interrupt speech.
Return ONLY valid JSON array with objects matching:
[
  {
    "title": "Clear punchy title",
    "hook": "First 3-second spoken hook line",
    "startTime": 0,
    "endTime": 30,
    "duration": 30,
    "viralityScore": 88,
    "viralityReason": "Explains why this moment retains attention",
    "suggestedCaption": "Ready-to-post caption with 3 relevant hashtags",
    "transcriptSample": "Brief transcription or dialogue snippet"
  }
]`;

    const raw = await this.generateText(prompt, 'You are an expert viral video editor. Return ONLY valid JSON.');
    if (raw) {
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: HighlightCandidate[] = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => ({
            ...c,
            startTime: Math.max(0, Math.min(video.duration - 5, c.startTime)),
            endTime: Math.min(video.duration, Math.max(c.startTime + 5, c.endTime)),
            duration: Math.min(video.duration - c.startTime, c.endTime - c.startTime)
          }));
        }
      } catch (e) {
        console.warn('[AI] Failed to parse LLM highlights response, using speech-aware detector');
      }
    }

    return this.generateSpeechAwareHighlights(video, targetDurationSec, speechIntervals, chapters);
  }

  private generateSpeechAwareHighlights(
    video: VideoRecord,
    targetSec: number,
    speechIntervals: { start: number; end: number }[],
    chapters: { title: string; start: number; end: number }[]
  ): HighlightCandidate[] {
    const total = Math.max(10, Math.floor(video.duration || 60));
    const target = Math.min(Math.max(15, targetSec), Math.floor(total * 0.9));
    const candidates: HighlightCandidate[] = [];

    if (chapters.length >= 2) {
      for (let i = 0; i < Math.min(3, chapters.length); i++) {
        const ch = chapters[i];
        const chDuration = ch.end - ch.start;
        const dur = Math.min(target, Math.max(15, Math.round(chDuration)));
        const start = Math.round(ch.start);
        const end = Math.min(total, start + dur);

        candidates.push({
          title: ch.title,
          hook: `Key insight from ${ch.title}: here is what matters most.`,
          startTime: start,
          endTime: end,
          duration: end - start,
          viralityScore: 90 - i * 3,
          viralityReason: `Structured around original chapter segment "${ch.title}" with clear narrative bounds.`,
          suggestedCaption: `Breakdown on ${ch.title} from ${video.title}. What are your thoughts? #shorts #breakdown #insights`,
          transcriptSample: `Chapter section "${ch.title}" spoken discussion.`
        });
      }
      return candidates;
    }

    const findSnappedSegment = (idealStart: number, idealDuration: number): { start: number; end: number } => {
      let start = idealStart;
      let end = Math.min(total, idealStart + idealDuration);

      if (speechIntervals.length > 0) {
        const closestStart = speechIntervals.find(s => Math.abs(s.start - idealStart) <= 6);
        if (closestStart) start = Math.max(0, closestStart.start);

        const targetEnd = start + idealDuration;
        const closestEnd = speechIntervals.find(s => Math.abs(s.end - targetEnd) <= 6 && s.end > start + 10);
        if (closestEnd) end = Math.min(total, closestEnd.end);
        else end = Math.min(total, start + idealDuration);
      }

      return { start: Math.round(start * 10) / 10, end: Math.round(end * 10) / 10 };
    };

    const seg1 = findSnappedSegment(0, target);
    candidates.push({
      title: `${video.title.slice(0, 32)}: Core Takeaway`,
      hook: `Here is the most important lesson from ${video.title}.`,
      startTime: seg1.start,
      endTime: seg1.end,
      duration: Math.max(10, Math.round(seg1.end - seg1.start)),
      viralityScore: 93,
      viralityReason: "Immediate premise delivery snapped to speech start, ideal for cold discovery.",
      suggestedCaption: `Key insight from ${video.title}. Did you know this? #insights #tips #guide`,
      transcriptSample: `Opening spoken segment introducing the central topic.`
    });

    if (total >= 35) {
      const midStart = Math.min(Math.floor(total * 0.35), total - target);
      const seg2 = findSnappedSegment(midStart, target);
      candidates.push({
        title: `The Critical Technique Breakdown`,
        hook: `Watch how this works in real practice.`,
        startTime: seg2.start,
        endTime: seg2.end,
        duration: Math.max(10, Math.round(seg2.end - seg2.start)),
        viralityScore: 88,
        viralityReason: "High-density actionable demonstration that drives watch time and saves.",
        suggestedCaption: `The practical method explained in ${video.title}. Save for reference! #tutorial #howto #productivity`,
        transcriptSample: `In-depth operational discussion and step analysis.`
      });
    }

    if (total >= 60) {
      const lateStart = Math.max(0, total - target);
      const seg3 = findSnappedSegment(lateStart, target);
      candidates.push({
        title: `Actionable Next Step & Conclusion`,
        hook: `If you want to apply this yourself, start with this one move.`,
        startTime: seg3.start,
        endTime: seg3.end,
        duration: Math.max(10, Math.round(seg3.end - seg3.start)),
        viralityScore: 85,
        viralityReason: "Definitive takeaway driving comment engagement and shares.",
        suggestedCaption: `Final summary from ${video.title}. Share your opinion in the comments! #summary #strategy #learn`,
        transcriptSample: `Concluding remarks synthesizing the core points into actionable advice.`
      });
    }

    return candidates;
  }
}

export const aiService = new AIService();
