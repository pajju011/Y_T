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

    // 4. Clean Ambient Audio Bed Fallback (100% Free, Offline)
    console.log('[TTS] Using ambient audio bed (No TTS API configured or keys inactive)');
    return new Promise((resolve) => {
      const duration = 30;
      const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=432:duration=${duration}" -af "volume=0.25,afade=t=in:ss=0:d=1,afade=t=out:st=28:d=2" -c:a libmp3lame -b:a 128k "${outputPath}"`;
      exec(cmd, () => {
        resolve({ audioPath: outputPath, duration, provider: 'Ambient Audio Bed' });
      });
    });
  }
}

export const ttsService = new TextToSpeechService();
