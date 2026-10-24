import fs from 'fs';
import path from 'path';

export interface YouTubeUploadOptions {
  filePath: string;
  title: string;
  description: string;
  accessToken: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
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
   * Upload video file directly to YouTube Shorts via YouTube Data API v3
   */
  public async uploadShort(options: YouTubeUploadOptions): Promise<{ videoId: string; url: string }> {
    const { filePath, title, description, accessToken, privacyStatus = 'public' } = options;

    if (!fs.existsSync(filePath)) {
      throw new Error(`Video file not found at ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    // Ensure #Shorts is in the title and description for YouTube Shorts shelf ranking
    const finalTitle = title.includes('#Shorts') ? title : `${title} #Shorts`;
    const finalDesc = `${description}\n\nUploaded with ClipGenius AI #Shorts`;

    const metadata = {
      snippet: {
        title: finalTitle.slice(0, 100),
        description: finalDesc,
        tags: ['Shorts', 'clipgenius', 'trending', 'shorts'],
        categoryId: '22' // People & Blogs
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
        'Content-Type: video/mp4\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n'
      ),
      Buffer.from(fileBuffer.toString('base64')),
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
      throw new Error(`YouTube API upload error (${response.status}): ${err}`);
    }

    const result = await response.json();
    const videoId = result.id;
    return {
      videoId,
      url: `https://youtube.com/shorts/${videoId}`
    };
  }
}

export const youtubeService = new YouTubeService();
