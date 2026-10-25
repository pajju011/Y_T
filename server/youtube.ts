import fs from 'fs';
import path from 'path';

export interface YouTubeUploadOptions {
  filePath: string;
  title: string;
  description: string;
  accessToken: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  tags?: string[];
  categoryId?: string;
  isShort?: boolean;
}

export class YouTubeService {
  /**
   * Generates Google OAuth 2.0 URL
   */
  public getAuthUrl(clientId: string, redirectUri: string): string {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: redirectUri,
      client_id: clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ].join(' ')
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens
   */
  public async getTokens(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string }> {
    const url = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values).toString()
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to exchange token: ${err}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || ''
    };
  }

  /**
   * Upload video file directly to YouTube (Shorts or Standard Landscape) via YouTube Data API v3
   */
  public async uploadVideo(options: YouTubeUploadOptions): Promise<{ videoId: string; url: string }> {
    const {
      filePath,
      title,
      description,
      accessToken,
      privacyStatus = 'public',
      tags = ['clipgenius', 'ai', 'video'],
      categoryId = '22',
      isShort = true
    } = options;

    if (!fs.existsSync(filePath)) {
      throw new Error(`Video file not found at ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const finalTitle = isShort && !title.includes('#Shorts') ? `${title} #Shorts` : title;
    const finalDesc = isShort && !description.includes('#Shorts') ? `${description}\n\n#Shorts #ClipGenius` : description;

    const metadata = {
      snippet: {
        title: finalTitle.slice(0, 100),
        description: finalDesc.slice(0, 5000),
        tags: Array.from(new Set([...tags, 'clipgenius', isShort ? 'Shorts' : 'video'])),
        categoryId: categoryId || '22'
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false
      }
    };

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: video/mp4\r\n\r\n'
      ),
      fileBuffer,
      Buffer.from(closeDelimiter)
    ]);

    const uploadUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status';

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartRequestBody.length)
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const err = await response.text();
      let parsedMsg = err;
      try {
        const j = JSON.parse(err);
        parsedMsg = j?.error?.message || err;
      } catch (e) {}
      throw new Error(`YouTube API upload error (${response.status}): ${parsedMsg}`);
    }

    const result = await response.json();
    const videoId = result.id;
    return {
      videoId,
      url: isShort ? `https://youtube.com/shorts/${videoId}` : `https://youtu.be/${videoId}`
    };
  }

  /**
   * Backward-compatible alias for uploadShort
   */
  public async uploadShort(options: YouTubeUploadOptions): Promise<{ videoId: string; url: string }> {
    return this.uploadVideo({ ...options, isShort: true });
  }
}

export const youtubeService = new YouTubeService();
