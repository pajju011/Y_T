import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { db } from './db.js';
import { ffmpegService } from './ffmpeg.js';

export interface TTSResult {
  audioPath: string;
  duration: number;
  provider: string;
}

export class TextToSpeechService {
  /**
   * Generates realistic spoken voiceover from text using configured provider
   */
  public async generateSpeech(text: string, outputFilename: string): Promise<TTSResult> {
    const settings = db.getSettings();
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'audio');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const outputPath = path.join(uploadsDir, outputFilename);

    // 1. Try ElevenLabs
    if (settings.elevenLabsApiKey && settings.elevenLabsApiKey.trim() !== '') {
      try {
        console.log('[TTS] Generating speech with ElevenLabs...');
        const voiceId = settings.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': settings.elevenLabsApiKey.trim()
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(outputPath, Buffer.from(buffer));
          const meta = await ffmpegService.getMetadata(outputPath);
          return { audioPath: outputPath, duration: meta.duration || 30, provider: 'ElevenLabs' };
        } else {
          const errText = await response.text();
          console.warn('[TTS] ElevenLabs responded with error:', errText);
        }
      } catch (err: any) {
        console.warn('[TTS] ElevenLabs failed:', err.message);
      }
    }

    // 2. Try OpenAI TTS
    if (settings.openaiApiKey && settings.openaiApiKey.trim() !== '') {
      try {
        console.log('[TTS] Generating speech with OpenAI TTS...');
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.openaiApiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: settings.openaiTtsVoice || 'alloy'
          })
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(outputPath, Buffer.from(buffer));
          const meta = await ffmpegService.getMetadata(outputPath);
          return { audioPath: outputPath, duration: meta.duration || 30, provider: 'OpenAI TTS' };
        } else {
          const errText = await response.text();
          console.warn('[TTS] OpenAI TTS responded with error:', errText);
        }
      } catch (err: any) {
        console.warn('[TTS] OpenAI TTS failed:', err.message);
      }
    }

    // 3. Try Deepgram Aura
    if (settings.deepgramApiKey && settings.deepgramApiKey.trim() !== '') {
      try {
        console.log('[TTS] Generating speech with Deepgram Aura...');
        const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${settings.deepgramApiKey.trim()}`
          },
          body: JSON.stringify({ text })
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(outputPath, Buffer.from(buffer));
          const meta = await ffmpegService.getMetadata(outputPath);
          return { audioPath: outputPath, duration: meta.duration || 30, provider: 'Deepgram Aura' };
        }
      } catch (err: any) {
        console.warn('[TTS] Deepgram Aura failed:', err.message);
      }
    }

    // 4. Free Neural Voice Engine (Google Neural Voice - 100% Free, Zero API Keys)
    try {
      console.log('[TTS] Generating speech with Free Google Neural Voice engine...');
      const speechBuffer = await this.fetchFreeGoogleTts(text);
      if (speechBuffer && speechBuffer.length > 1000) {
        fs.writeFileSync(outputPath, speechBuffer);
        const meta = await ffmpegService.getMetadata(outputPath);
        return { audioPath: outputPath, duration: meta.duration || 30, provider: 'Google Neural Voice (Free)' };
      }
    } catch (err: any) {
      console.warn('[TTS] Free Google Voice failed:', err.message);
    }

    // 5. Clean Ambient Audio Bed Fallback (Offline fallback)
    console.log('[TTS] Using ambient audio bed (Offline fallback)');
    return new Promise((resolve) => {
      const duration = 30;
      const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=432:duration=${duration}" -af "volume=0.25,afade=t=in:ss=0:d=1,afade=t=out:st=28:d=2" -c:a libmp3lame -b:a 128k "${outputPath}"`;
      exec(cmd, () => {
        resolve({ audioPath: outputPath, duration, provider: 'Ambient Audio Bed' });
      });
    });
  }

  /**
   * Fetches realistic spoken voice chunks from free Google Voice API and concatenates into MP3
   */
  private async fetchFreeGoogleTts(text: string): Promise<Buffer | null> {
    try {
      const rawSentences = text
        .replace(/([.?!,;])\s+/g, '$1|')
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const chunks: string[] = [];
      for (const sent of rawSentences) {
        if (sent.length <= 120) {
          chunks.push(sent);
        } else {
          const words = sent.split(' ');
          let cur = '';
          for (const w of words) {
            if ((cur + ' ' + w).length <= 120) {
              cur = cur ? cur + ' ' + w : w;
            } else {
              if (cur) chunks.push(cur);
              cur = w;
            }
          }
          if (cur) chunks.push(cur);
        }
      }

      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        const cleanChunk = chunk.replace(/["'#*]/g, '');
        if (!cleanChunk) continue;
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(cleanChunk)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (res.ok) {
          const ab = await res.arrayBuffer();
          audioBuffers.push(Buffer.from(ab));
        }
      }

      if (audioBuffers.length > 0) {
        return Buffer.concat(audioBuffers);
      }
    } catch (e: any) {
      console.warn('[TTS] Google Free TTS fetch error:', e.message);
    }
    return null;
  }
}

export const ttsService = new TextToSpeechService();
