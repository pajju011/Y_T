import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const KNOWN_GYAN_DIR = 'C:\\Users\\ASUS\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin';

export class FFmpegService {
  private ffmpegBin: string = 'ffmpeg';
  private ffprobeBin: string = 'ffprobe';
  private isDetected: boolean = false;
  private versionInfo: string = 'Not detected';

  constructor() {
    this.detectBinaries();
  }

  private detectBinaries() {
    const customFfmpeg = path.join(KNOWN_GYAN_DIR, 'ffmpeg.exe');
    const customFfprobe = path.join(KNOWN_GYAN_DIR, 'ffprobe.exe');

    if (fs.existsSync(customFfmpeg) && fs.existsSync(customFfprobe)) {
      this.ffmpegBin = `"${customFfmpeg}"`;
      this.ffprobeBin = `"${customFfprobe}"`;
      this.isDetected = true;
    } else {
      this.ffmpegBin = 'ffmpeg';
      this.ffprobeBin = 'ffprobe';
    }

    exec(`${this.ffmpegBin} -version`, (err, stdout) => {
      if (!err && stdout) {
        this.isDetected = true;
        const firstLine = stdout.split('\n')[0];
        this.versionInfo = firstLine.trim();
        console.log(`[FFmpeg] Initialized successfully: ${this.versionInfo}`);
      } else {
        console.warn('[FFmpeg] Not found in standard paths, video processing will use fallback');
      }
    });
  }

  public getStatus() {
    return {
      available: this.isDetected,
      version: this.versionInfo,
      ffmpegBinary: this.ffmpegBin,
      ffprobeBinary: this.ffprobeBin
    };
  }

  public async getVideoMetadata(filePath: string): Promise<{ duration: number; width: number; height: number; size: number }> {
    return new Promise((resolve, reject) => {
      const cmd = `${this.ffprobeBin} -v error -select_streams v:0 -show_entries stream=width,height,duration -show_entries format=duration,size -of json "${filePath}"`;
      exec(cmd, (err, stdout) => {
        if (err) {
          // Fallback if ffprobe fails
          try {
            const stats = fs.statSync(filePath);
            return resolve({ duration: 60, width: 1920, height: 1080, size: stats.size });
          } catch (e) {
            return reject(err);
          }
        }

        try {
          const parsed = JSON.parse(stdout);
          const stream = parsed.streams && parsed.streams[0] ? parsed.streams[0] : {};
          const format = parsed.format || {};

          const duration = parseFloat(stream.duration || format.duration || '60');
          const width = parseInt(stream.width || '1920', 10);
          const height = parseInt(stream.height || '1080', 10);
          const size = parseInt(format.size || '0', 10);

          resolve({ duration: Math.max(1, duration), width, height, size });
        } catch (parseErr) {
          resolve({ duration: 60, width: 1920, height: 1080, size: 0 });
        }
      });
    });
  }

  public async extractThumbnail(videoPath: string, outputPath: string, timestampSeconds: number = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const cmd = `${this.ffmpegBin} -y -ss ${Math.max(0, timestampSeconds)} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`;
      exec(cmd, (err) => {
        if (err) {
          console.error('[FFmpeg] Failed to extract thumbnail:', err);
          return reject(err);
        }
        resolve(outputPath);
      });
    });
  }

  public async cutVerticalClip(
    sourcePath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    aspectRatio: '9:16' | '1:1' | '16:9' = '9:16'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      let filterString = '';
      if (aspectRatio === '9:16') {
        // Crop center 9:16 then scale to standard 1080x1920
        filterString = '-vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920"';
      } else if (aspectRatio === '1:1') {
        filterString = '-vf "crop=ih:ih:(iw-ih)/2:0,scale=1080:1080"';
      } else {
        filterString = '-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"';
      }

      const cmd = `${this.ffmpegBin} -y -ss ${startTime} -t ${duration} -i "${sourcePath}" ${filterString} -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;

      exec(cmd, (err) => {
        if (err) {
          console.error('[FFmpeg] Clip cut failed:', err);
          return reject(err);
        }
        resolve(outputPath);
      });
    });
  }

  public async createDemoVideo(outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 45-second demo video with colorbars, countdown timestamp timer and tone
      const cmd = `${this.ffmpegBin} -y -f lavfi -i "testsrc=duration=45:size=1920x1080:rate=30" -f lavfi -i "sine=frequency=520:duration=45" -vf "drawtext=text='ClipGenius AI Demo Stream':x=(w-text_w)/2:y=120:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6,drawtext=text='%{pts\\:hms}':x=(w-text_w)/2:y=h-200:fontsize=56:fontcolor=yellow:box=1:boxcolor=black@0.7" -c:v libx264 -pix_fmt yuv420p -c:a aac "${outputPath}"`;

      exec(cmd, (err) => {
        if (err) {
          // If drawtext font issue on windows, fallback to plain testsrc without text
          const fallbackCmd = `${this.ffmpegBin} -y -f lavfi -i "testsrc=duration=45:size=1920x1080:rate=30" -f lavfi -i "sine=frequency=520:duration=45" -c:v libx264 -pix_fmt yuv420p -c:a aac "${outputPath}"`;
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

export const ffmpegService = new FFmpegService();
