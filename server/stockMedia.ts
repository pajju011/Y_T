import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from './db.js';

export interface SceneVisualOptions {
  prompt: string;
  niche?: string;
  style?: string;
  aspectRatio?: '9:16' | '16:9';
  sceneIndex?: number;
}

export class StockMediaService {
  /**
   * Generates or fetches a high-impact, topic-specific visual for a scene.
   * Uses AI image generation (Pollinations AI) with Wikimedia Commons high-res photo fallback.
   */
  public async fetchSceneVisual(options: SceneVisualOptions): Promise<string | null> {
    const { prompt, style = 'cinematic', aspectRatio = '9:16', sceneIndex = 0 } = options;
    const stockDir = path.resolve(process.cwd(), 'uploads', 'stock');
    if (!fs.existsSync(stockDir)) {
      fs.mkdirSync(stockDir, { recursive: true });
    }

    // Clean & enhance visual prompt based on style
    let enhancedStyle = 'cinematic lighting, ultra detailed, photorealistic 8k, sharp focus, vibrant, dramatic atmosphere';
    if (style === 'mouthwatering') {
      enhancedStyle = 'mouthwatering delicious food photography, culinary commercial lighting, fresh, steaming hot, 8k, vibrant colors';
    } else if (style === 'neon' || style === 'cyberpunk') {
      enhancedStyle = 'cyberpunk neon glow, volumetric lighting, futuristic, octane render, 8k, synthwave aesthetic';
    } else if (style === 'editorial' || style === 'documentary') {
      enhancedStyle = 'editorial photography, national geographic style, dramatic lighting, high contrast, award winning';
    } else if (style === 'kinetic' || style === 'vibrant') {
      enhancedStyle = 'vibrant colors, dynamic action shot, hyper-detailed, high energy composition, cinematic masterpiece';
    }

    const fullVisualPrompt = `${prompt}, ${enhancedStyle}`;
    const hash = crypto.createHash('md5').update(`${fullVisualPrompt}-${aspectRatio}`).digest('hex').slice(0, 12);
    const filename = `scene-${sceneIndex}-${hash}.jpg`;
    const filePath = path.join(stockDir, filename);

    // Return cached if already downloaded
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 5000) {
      console.log(`[Visual Engine] Using cached scene visual: ${filename}`);
      return filePath;
    }

    const isVertical = aspectRatio === '9:16';
    const width = isVertical ? 1080 : 1920;
    const height = isVertical ? 1920 : 1080;

    // 1. Try Pollinations AI Custom Generation (Fast 10s budget)
    try {
      console.log(`[Visual Engine] Generating AI visual via Pollinations for scene ${sceneIndex + 1} ("${prompt.slice(0, 36)}")...`);
      const encodedPrompt = encodeURIComponent(fullVisualPrompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 5000) {
          fs.writeFileSync(filePath, Buffer.from(buffer));
          console.log(`[Visual Engine] Scene visual saved from Pollinations: ${filename} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
          return filePath;
        }
      }
    } catch (err: any) {
      console.warn(`[Visual Engine] Pollinations generation notice:`, err.message);
    }

    // 2. High-Speed Wikimedia Commons Photography Fallback (Instant, 100% Free)
    try {
      const cleanKeywords = prompt.replace(/[^\w\s]/g, '').split(/\s+/).slice(0, 3).join(' ') || 'cinematic';
      console.log(`[Visual Engine] Fetching high-res photography from Wikimedia Commons for "${cleanKeywords}"...`);
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanKeywords)}&gsrlimit=8&prop=imageinfo&iiprop=url`;

      const wmRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'ClipGeniusAI/1.0 (contact@clipgenius.local)' }
      });

      if (wmRes.ok) {
        const data = await wmRes.json();
        const pages = Object.values(data?.query?.pages || {}) as any[];
        const validUrls = pages
          .map(p => p.imageinfo?.[0]?.url as string)
          .filter(u => u && u.split('?')[0].match(/\.(jpg|jpeg|png|webp)$/i));

        if (validUrls.length > 0) {
          const selectedUrl = validUrls[sceneIndex % validUrls.length];
          console.log(`[Visual Engine] Downloading Wikimedia photo for scene ${sceneIndex + 1}: ${selectedUrl.slice(0, 80)}...`);
          const imgRes = await fetch(selectedUrl, {
            headers: { 'User-Agent': 'ClipGeniusAI/1.0 (contact@clipgenius.local)' }
          });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            if (buffer.byteLength > 5000) {
              fs.writeFileSync(filePath, Buffer.from(buffer));
              console.log(`[Visual Engine] Scene visual saved from Wikimedia Commons: ${filename} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
              return filePath;
            }
          }
        }
      }
    } catch (wmErr: any) {
      console.warn('[Visual Engine] Wikimedia fallback notice:', wmErr.message);
    }

    return null;
  }

  /**
   * Fetches real vertical 9:16 background stock footage for a topic using configured API
   */
  public async fetchBackgroundVideo(topic: string, durationSec: number = 30): Promise<string | null> {
    const settings = db.getSettings();
    const stockDir = path.resolve(process.cwd(), 'uploads', 'stock');
    if (!fs.existsSync(stockDir)) {
      fs.mkdirSync(stockDir, { recursive: true });
    }

    // 1. Pexels Stock Video API
    if (settings.pexelsApiKey && settings.pexelsApiKey.trim() !== '') {
      try {
        console.log(`[Stock Media] Searching Pexels for vertical footage on "${topic}"...`);
        const cleanQuery = topic.split(' ').slice(0, 3).join(' ') || 'technology';
        const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(cleanQuery)}&orientation=portrait&per_page=6`;

        const response = await fetch(url, {
          headers: {
            'Authorization': settings.pexelsApiKey.trim(),
            'User-Agent': 'ClipGenius-AI/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const videos = data.videos || [];
          if (videos.length > 0) {
            const firstVideo = videos[0];
            const files = firstVideo.video_files || [];
            const portraitFile = files.find((f: any) => f.height > f.width && f.width >= 720) || files[0];
            if (portraitFile && portraitFile.link) {
              const filename = `pexels-${firstVideo.id}.mp4`;
              const filePath = path.join(stockDir, filename);

              if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100000) {
                return filePath;
              }

              const dlRes = await fetch(portraitFile.link);
              if (dlRes.ok) {
                const buffer = await dlRes.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(buffer));
                return filePath;
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[Stock Media] Pexels search failed:', err.message);
      }
    }

    return null;
  }
}

export const stockMediaService = new StockMediaService();
