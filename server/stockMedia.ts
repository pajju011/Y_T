import fs from 'fs';
import path from 'path';
import { db } from './db.js';

export class StockMediaService {
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
        // Clean query to 1-2 core keywords (e.g., "artificial intelligence", "technology", "business")
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
            // Find portrait file (height > width)
            const portraitFile = files.find((f: any) => f.height > f.width && f.width >= 720) || files[0];
            if (portraitFile && portraitFile.link) {
              const filename = `pexels-${firstVideo.id}.mp4`;
              const filePath = path.join(stockDir, filename);

              // Return cached if already downloaded
              if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100000) {
                console.log('[Stock Media] Using cached Pexels video:', filePath);
                return filePath;
              }

              console.log('[Stock Media] Downloading Pexels video stream...');
              const dlRes = await fetch(portraitFile.link);
              if (dlRes.ok) {
                const buffer = await dlRes.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(buffer));
                console.log(`[Stock Media] Pexels video saved: ${filePath} (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB)`);
                return filePath;
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[Stock Media] Pexels search failed:', err.message);
      }
    }

    // 2. Pixabay Video API
    if (settings.pixabayApiKey && settings.pixabayApiKey.trim() !== '') {
      try {
        console.log(`[Stock Media] Searching Pixabay for footage on "${topic}"...`);
        const cleanQuery = encodeURIComponent(topic.split(' ').slice(0, 2).join(' ') || 'technology');
        const url = `https://pixabay.com/api/videos/?key=${settings.pixabayApiKey.trim()}&q=${cleanQuery}&video_type=film`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const hits = data.hits || [];
          if (hits.length > 0) {
            const hit = hits[0];
            const videoUrl = hit.videos?.medium?.url || hit.videos?.small?.url;
            if (videoUrl) {
              const filename = `pixabay-${hit.id}.mp4`;
              const filePath = path.join(stockDir, filename);
              if (fs.existsSync(filePath)) return filePath;

              const dlRes = await fetch(videoUrl);
              if (dlRes.ok) {
                const buffer = await dlRes.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(buffer));
                return filePath;
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[Stock Media] Pixabay search failed:', err.message);
      }
    }

    return null;
  }
}

export const stockMediaService = new StockMediaService();
