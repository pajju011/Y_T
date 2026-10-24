import { db, VideoRecord } from './db.js';

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
    const prompt = `Analyze this video titled "${video.title}" with duration ${video.duration} seconds.
Suggest 3 high-retention short-form video clips (target duration: ~${targetDurationSec} seconds each) suitable for YouTube Shorts and TikTok.
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
        console.warn('[AI] Failed to parse LLM highlights response, using heuristic fallback');
      }
    }

    // Heuristic Fallback
    return this.generateHeuristicHighlights(video, targetDurationSec);
  }

  private generateHeuristicHighlights(video: VideoRecord, targetSec: number): HighlightCandidate[] {
    const total = Math.floor(video.duration || 60);
    const clipLength = Math.min(Math.max(15, targetSec), Math.floor(total * 0.7));
    const candidates: HighlightCandidate[] = [];

    const end1 = Math.min(total, clipLength);
    candidates.push({
      title: `${video.title.slice(0, 32)}: Core Insight`,
      hook: "If you only take away one lesson from this entire breakdown, start here.",
      startTime: 0,
      endTime: end1,
      duration: end1,
      viralityScore: 92,
      viralityReason: "Immediate premise delivery within first 3 seconds, ideal for cold audience discovery.",
      suggestedCaption: `Key takeaway from ${video.title}. What do you think about this approach? #learning #tips #insights`,
      transcriptSample: `Opening introduction setting the stakes and defining the core problem statement.`
    });

    if (total >= 40) {
      const start2 = Math.min(Math.floor(total * 0.35), total - clipLength);
      const end2 = Math.min(total, start2 + clipLength);
      candidates.push({
        title: `The Critical Step Explained`,
        hook: "Most people skip this step, and that is why their execution breaks down.",
        startTime: start2,
        endTime: end2,
        duration: end2 - start2,
        viralityScore: 86,
        viralityReason: "High-density procedural explanation that encourages rewatching and saves.",
        suggestedCaption: `The step most people overlook. Save this for later when setting up your own workflow. #workflow #productivity #howto`,
        transcriptSample: `Step-by-step breakdown demonstrating the practical mechanics and nuances.`
      });
    }

    if (total >= 70) {
      const start3 = Math.max(0, total - clipLength);
      candidates.push({
        title: `Final Conclusion & Actionable Advice`,
        hook: "Here is the exact roadmap to put this into practice today.",
        startTime: start3,
        endTime: total,
        duration: total - start3,
        viralityScore: 84,
        viralityReason: "Definitive closure and call-to-action driving comment debate and shares.",
        suggestedCaption: `The conclusion to ${video.title}. Follow for more actionable guides. #strategy #success #guide`,
        transcriptSample: `Summary synthesizing the earlier points into an immediate action item.`
      });
    }

    return candidates;
  }
}

export const aiService = new AIService();
