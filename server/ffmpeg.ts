import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const KNOWN_GYAN_DIR = 'C:\\Users\\ASUS\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin';
const YT_DLP_PATH = path.resolve(process.cwd(), 'bin', 'yt-dlp.exe');

export type FramingMode = 'center' | 'left' | 'right' | 'blur_fit';
export type AspectRatio = '9:16' | '1:1' | '16:9';
export type CaptionStyle = 'bold-yellow' | 'minimal-white' | 'karaoke-blue' | 'none';

export interface CutClipOptions {
  startTime: number;
  duration: number;
  aspectRatio?: AspectRatio;
  framingMode?: FramingMode;
  captionStyle?: CaptionStyle;
  hookText?: string;
}

export class FFmpegService {
  private ffmpegBin: string = 'ffmpeg';
  private ffprobeBin: string = 'ffprobe';
  private ytDlpBin: string = YT_DLP_PATH;
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

    if (fs.existsSync(YT_DLP_PATH)) {
      this.ytDlpBin = `"${YT_DLP_PATH}"`;
    }

    exec(`${this.ffmpegBin} -version`, (err, stdout) => {
      if (!err && stdout) {
        this.isDetected = true;
        const firstLine = stdout.split('\n')[0];
        this.versionInfo = firstLine.trim();
        console.log(`[FFmpeg] Initialized successfully: ${this.versionInfo}`);
      } else {
        console.warn('[FFmpeg] Not found in standard paths');
      }
    });
  }

  public getStatus() {
    return {
      available: this.isDetected,
      version: this.versionInfo,
      ffmpegBinary: this.ffmpegBin,
      ffprobeBinary: this.ffprobeBin,
      hasYtDlp: fs.existsSync(YT_DLP_PATH)
    };
  }

  public async getVideoMetadata(filePath: string): Promise<{ duration: number; width: number; height: number; size: number }> {
    return new Promise((resolve, reject) => {
      const cmd = `${this.ffprobeBin} -v error -select_streams v:0 -show_entries stream=width,height,duration -show_entries format=duration,size -of json "${filePath}"`;
      exec(cmd, (err, stdout) => {
        if (err) {
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

  public async getMetadata(filePath: string): Promise<{ duration: number; width: number; height: number; size: number }> {
    return this.getVideoMetadata(filePath);
  }

  /**
   * Detects active speech intervals and natural sentence pauses via FFmpeg silencedetect
   */
  public async detectSpeechIntervals(filePath: string, videoDuration: number): Promise<{ start: number; end: number }[]> {
    return new Promise((resolve) => {
      const cmd = `${this.ffmpegBin} -i "${filePath}" -af "silencedetect=noise=-30dB:d=0.4" -f null -`;
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        const output = (stderr || '') + (stdout || '');
        const silences: { start: number; end: number }[] = [];

        const startRegex = /silence_start:\s*([\d.]+)/g;
        const endRegex = /silence_end:\s*([\d.]+)/g;

        let startMatch;
        const starts: number[] = [];
        while ((startMatch = startRegex.exec(output)) !== null) {
          starts.push(parseFloat(startMatch[1]));
        }

        let endMatch;
        const ends: number[] = [];
        while ((endMatch = endRegex.exec(output)) !== null) {
          ends.push(parseFloat(endMatch[1]));
        }

        const count = Math.min(starts.length, ends.length);
        for (let i = 0; i < count; i++) {
          silences.push({ start: starts[i], end: ends[i] });
        }

        if (silences.length === 0) {
          return resolve([{ start: 0, end: videoDuration }]);
        }

        const speechSegments: { start: number; end: number }[] = [];
        let cur = 0;
        for (const s of silences) {
          if (s.start > cur + 1) {
            speechSegments.push({ start: cur, end: s.start });
          }
          cur = s.end;
        }
        if (cur < videoDuration - 1) {
          speechSegments.push({ start: cur, end: videoDuration });
        }

        resolve(speechSegments.length > 0 ? speechSegments : [{ start: 0, end: videoDuration }]);
      });
    });
  }

  /**
   * Reads embedded video chapter markers if present (YouTube / MP4 / MKV)
   */
  public async getChapters(filePath: string): Promise<{ title: string; start: number; end: number }[]> {
    return new Promise((resolve) => {
      const cmd = `${this.ffprobeBin} -v error -print_format json -show_chapters "${filePath}"`;
      exec(cmd, (err, stdout) => {
        if (err || !stdout) return resolve([]);
        try {
          const parsed = JSON.parse(stdout);
          const chapters = parsed.chapters || [];
          const results = chapters.map((ch: any) => ({
            title: ch.tags?.title || `Chapter ${ch.id + 1}`,
            start: parseFloat(ch.start_time || '0'),
            end: parseFloat(ch.end_time || '0')
          })).filter((c: any) => c.end > c.start);
          resolve(results);
        } catch {
          resolve([]);
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

  /**
   * Generates a styled ASS subtitle file for permanently burned-in captions
   */
  public createAssSubtitle(text: string, duration: number, style: CaptionStyle, outputPath: string): string {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let primaryColor = '&H0000FFFF'; // Bold Yellow (Default)
    let fontSize = 60;
    if (style === 'minimal-white') {
      primaryColor = '&H00FFFFFF';
      fontSize = 52;
    } else if (style === 'karaoke-blue') {
      primaryColor = '&H00FFA500'; // Light Sky Blue in BGR
      fontSize = 62;
    }

    const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${fontSize},${primaryColor},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // Break text into short phrase events paced across clip duration
    const words = text.replace(/["']/g, '').split(/\s+/).filter(Boolean);
    const chunkSize = 3;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    if (chunks.length === 0) chunks.push(text);

    const timePerChunk = Math.max(1.2, duration / chunks.length);
    let events = '';

    const formatAssTime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const cs = Math.floor((sec % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    chunks.forEach((chunk, idx) => {
      const start = idx * timePerChunk;
      const end = Math.min(duration, (idx + 1) * timePerChunk);
      events += `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,,0,0,0,,{\\b1\\uppercase}${chunk.toUpperCase()}{\\b0}\n`;
    });

    fs.writeFileSync(outputPath, assHeader + events, 'utf-8');
    return outputPath;
  }

  /**
   * Advanced video cut with Framing Modes & Burned Subtitles
   */
  public async cutVerticalClip(
    sourcePath: string,
    outputPath: string,
    options: CutClipOptions
  ): Promise<string> {
    const {
      startTime,
      duration,
      aspectRatio = '9:16',
      framingMode = 'center',
      captionStyle = 'bold-yellow',
      hookText = ''
    } = options;

    return new Promise((resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Generate ASS subtitles file if requested
      let subPath: string | null = null;
      if (captionStyle !== 'none' && hookText.trim()) {
        const subFilename = `sub-${Date.now()}-${Math.round(Math.random() * 1000)}.ass`;
        subPath = path.join(targetDir, subFilename);
        this.createAssSubtitle(hookText, duration, captionStyle, subPath);
      }

      // Video filter generation
      let filterComplex = '';

      if (aspectRatio === '9:16') {
        if (framingMode === 'blur_fit') {
          // Cinematic blurred background + sharp centered video
          filterComplex = `-filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];[0:v]scale=1080:-1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]" -map "[v]" -map 0:a?`;
        } else if (framingMode === 'left') {
          // Crop left 9:16
          filterComplex = `-vf "crop=ih*9/16:ih:0:0,scale=1080:1920"`;
        } else if (framingMode === 'right') {
          // Crop right 9:16
          filterComplex = `-vf "crop=ih*9/16:ih:iw-ih*9/16:0,scale=1080:1920"`;
        } else {
          // Standard center crop 9:16
          filterComplex = `-vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920"`;
        }
      } else if (aspectRatio === '1:1') {
        filterComplex = `-vf "crop=ih:ih:(iw-ih)/2:0,scale=1080:1080"`;
      } else {
        filterComplex = `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"`;
      }

      // Inject burned subtitle filter if generated
      if (subPath && fs.existsSync(subPath)) {
        // Format path for FFmpeg windows escaping: forward slashes and escape colon
        const escapedSubPath = subPath.replace(/\\/g, '/').replace(/:/g, '\\:');
        if (filterComplex.includes('-filter_complex')) {
          // Append subtitles filter to the stream
          filterComplex = filterComplex.replace('[v]"', `[vtemp];[vtemp]ass='${escapedSubPath}'[v]"`);
        } else {
          // Append to existing -vf string
          filterComplex = filterComplex.replace('"', `",ass='${escapedSubPath}'`);
        }
      }

      const cmd = `${this.ffmpegBin} -y -ss ${startTime} -t ${duration} -i "${sourcePath}" ${filterComplex} -c:v libx264 -preset fast -crf 21 -c:a aac -b:a 128k "${outputPath}"`;

      exec(cmd, (err) => {
        // Clean up temporary subtitle file
        if (subPath && fs.existsSync(subPath)) {
          try { fs.unlinkSync(subPath); } catch (e) {}
        }

        if (err) {
          console.error('[FFmpeg] Clip cut failed with advanced filters, attempting fallback:', err);
          // Fallback simple cut if filter failed
          const fallbackCmd = `${this.ffmpegBin} -y -ss ${startTime} -t ${duration} -i "${sourcePath}" -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;
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
   * Ingest video directly from YouTube URL via yt-dlp
   */
  public async downloadYouTubeVideo(url: string, targetDir: string): Promise<{ filePath: string; title: string }> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const uniqueId = 'yt-' + Date.now();
      const outputTemplate = path.join(targetDir, `${uniqueId}.%(ext)s`);

      // First get video title
      const titleCmd = `${this.ytDlpBin} --get-title --no-playlist "${url}"`;
      exec(titleCmd, (titleErr, titleStdout) => {
        const videoTitle = (!titleErr && titleStdout.trim()) ? titleStdout.trim() : 'YouTube Ingested Video';

        // Download best mp4 stream
        const dlCmd = `${this.ytDlpBin} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --no-playlist -o "${outputTemplate}" "${url}"`;
        exec(dlCmd, (dlErr) => {
          if (dlErr) {
            console.error('[yt-dlp] Download error:', dlErr);
            return reject(new Error('Failed to download YouTube video: ' + dlErr.message));
          }

          // Locate downloaded file with extension
          const files = fs.readdirSync(targetDir);
          const downloaded = files.find(f => f.startsWith(uniqueId));
          if (!downloaded) {
            return reject(new Error('Downloaded video file not found on disk.'));
          }

          const fullPath = path.join(targetDir, downloaded);
          resolve({ filePath: fullPath, title: videoTitle });
        });
      });
    });
  }

  public async createDemoVideo(outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const cmd = `${this.ffmpegBin} -y -f lavfi -i "testsrc=duration=45:size=1920x1080:rate=30" -f lavfi -i "sine=frequency=520:duration=45" -vf "drawtext=text='ClipGenius AI Demo Stream':x=(w-text_w)/2:y=120:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6,drawtext=text='%{pts\\:hms}':x=(w-text_w)/2:y=h-200:fontsize=56:fontcolor=yellow:box=1:boxcolor=black@0.7" -c:v libx264 -pix_fmt yuv420p -c:a aac "${outputPath}"`;

      exec(cmd, (err) => {
        if (err) {
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
