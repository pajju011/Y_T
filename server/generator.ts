import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { db, ClipRecord, LiveTrend, ContentStrategy } from './db.js';
import { ffmpegService } from './ffmpeg.js';
import { aiService } from './ai.js';
import { ttsService } from './tts.js';
import { stockMediaService } from './stockMedia.js';
import { webhookService } from './webhooks.js';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

export interface TrendScriptPlan {
  title: string;
  hook: string;
  scene1: string;
  scene2: string;
  scene3: string;
  fullNarration: string;
  caption: string;
  viralityScore: number;
  visualPrompts?: string[];
}

export interface PromptVideoOptions {
  prompt: string;
  aspectRatio?: '9:16' | '16:9';
  durationSec?: number;
  style?: 'cinematic' | 'kinetic' | 'editorial' | 'neon' | 'mouthwatering' | 'documentary';
  captionStyle?: 'bold-yellow' | 'karaoke-blue' | 'minimal-white' | 'red-alert';
  voiceLanguage?: string;
  voiceName?: string;
  musicBed?: boolean;
}

export class TrendVideoGenerator {
  /**
   * Generates a complete 9:16 vertical short video from scratch around a trend topic
   */
  public async generateTrendVideo(trend: LiveTrend, strategy: ContentStrategy, framework?: string): Promise<ClipRecord> {
    const targetDuration = strategy.durationSec || 30;
    const clipId = 'trend-vid-' + Date.now();
    const clipFilename = `trend-${clipId}.mp4`;
    const outputPath = path.join(uploadsDir, 'clips', clipFilename);
    const urlPath = `/uploads/clips/${clipFilename}`;

    console.log(`[Text-To-Video Engine] Creating creative multi-scene video for "${trend.title}"...`);

    // 1. Generate Structured AI Script with multi-scene visual prompts
    const scriptPlan = await this.generateScript(trend, strategy, framework);

    // 2. Generate Real Voiceover Audio (Edge Neural Voice / ElevenLabs / OpenAI)
    const audioFilename = `speech-${clipId}.mp3`;
    const ttsResult = await ttsService.generateSpeech(scriptPlan.fullNarration, audioFilename);
    const finalDuration = Math.max(15, Math.min(60, Math.round(ttsResult.duration || targetDuration)));

    // 3. Render Final Creative Multi-Scene Video with Ken Burns Motion & Burned Captions
    await this.renderMultiSceneVideo({
      scriptPlan,
      duration: finalDuration,
      audioPath: ttsResult.audioPath,
      outputPath,
      aspectRatio: '9:16',
      style: 'cinematic',
      captionStyle: 'bold-yellow',
      visualPrompts: scriptPlan.visualPrompts || [
        `${trend.niche} breaking news headline dramatic, 8k cinematic`,
        `analysts and researchers studying data breakdown, cinematic lighting`,
        `futuristic digital network connections glowing, hyper-detailed`,
        `high-impact conclusion reveal, cinematic lighting`
      ]
    });

    // 4. Extract High-Quality Thumbnail
    const thumbFilename = `thumb-${clipId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    const thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
    try {
      await ffmpegService.extractThumbnail(outputPath, thumbPath, 2);
    } catch (e) {}

    // 5. Save to Database as Pending Creator Approval
    const newClip: ClipRecord = {
      id: clipId,
      videoId: 'trend-origin',
      videoTitle: `AI Trend: ${trend.niche}`,
      title: scriptPlan.title,
      hook: scriptPlan.hook,
      transcript: scriptPlan.fullNarration,
      suggestedCaption: scriptPlan.caption,
      startTime: 0,
      endTime: finalDuration,
      duration: finalDuration,
      viralityScore: scriptPlan.viralityScore,
      viralityReason: `Engineered using ${framework || 'Problem-Agitate-Solve'} framework with ${ttsResult.provider} narration and multi-scene dynamic visuals.`,
      filePath: outputPath,
      urlPath: urlPath,
      thumbnailUrl: thumbnailUrl,
      aspectRatio: '9:16',
      framingMode: 'center',
      captionStyle: 'bold-yellow',
      status: 'in_review',
      scheduledDate: null,
      scheduledTime: null,
      platforms: strategy.preferredPlatforms || ['youtube', 'tiktok'],
      createdAt: new Date().toISOString(),
      approvedAt: null,
      publishedAt: null,
      trendSourceUrl: trend.url
    };

    db.addClip(newClip);
    db.addAuditLog('trend_video_generated', `Generated dynamic video "${newClip.title}" [Voice: ${ttsResult.provider}, Multi-Scene Ken Burns]`);
    await webhookService.dispatch('clip.generated', newClip);

    return newClip;
  }

  /**
   * Generates a high quality, creative AI video directly from a creator's prompt
   */
  public async generateVideoFromPrompt(options: PromptVideoOptions): Promise<ClipRecord> {
    const {
      prompt,
      aspectRatio = '9:16',
      durationSec = 30,
      style = 'cinematic',
      captionStyle = 'bold-yellow',
      voiceLanguage = 'English',
      voiceName = 'en-US-ChristopherNeural',
      musicBed = true
    } = options;

    const clipId = 'ai-video-' + Date.now();
    const clipFilename = `ai-video-${clipId}.mp4`;
    const outputPath = path.join(uploadsDir, 'clips', clipFilename);
    const urlPath = `/uploads/clips/${clipFilename}`;

    console.log(`[AI Prompt Video Engine] Directing creative short for: "${prompt}" (${aspectRatio}, style: ${style}, voice: ${voiceName})...`);

    // 1. Generate Structured AI Script with Tailored Scene Visuals
    const scriptPlan = await this.generatePromptScript(prompt, durationSec, voiceLanguage, style);

    // 2. Generate Real Voiceover Audio with Microsoft Edge Neural / Configured Voice
    const audioFilename = `prompt-speech-${clipId}.mp3`;
    const ttsResult = await ttsService.generateSpeech(scriptPlan.fullNarration, audioFilename, voiceName);
    const finalDuration = Math.max(12, Math.min(65, Math.round(ttsResult.duration || durationSec)));

    // 3. Render Final Video with Ken Burns Multi-Scene Engine & Burned Kinetic Captions
    await this.renderMultiSceneVideo({
      scriptPlan,
      duration: finalDuration,
      audioPath: ttsResult.audioPath,
      outputPath,
      aspectRatio,
      style,
      captionStyle,
      visualPrompts: scriptPlan.visualPrompts,
      musicBed
    });

    // 4. Extract High-Quality Thumbnail
    const thumbFilename = `thumb-${clipId}.jpg`;
    const thumbPath = path.join(uploadsDir, 'thumbnails', thumbFilename);
    const thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
    try {
      await ffmpegService.extractThumbnail(outputPath, thumbPath, 2);
    } catch (e) {}

    // 5. Save Record in Database
    const newClip: ClipRecord = {
      id: clipId,
      videoId: 'prompt-origin',
      videoTitle: `AI Prompt Video: ${prompt.slice(0, 30)}`,
      title: scriptPlan.title,
      hook: scriptPlan.hook,
      transcript: scriptPlan.fullNarration,
      suggestedCaption: scriptPlan.caption,
      startTime: 0,
      endTime: finalDuration,
      duration: finalDuration,
      viralityScore: scriptPlan.viralityScore || 95,
      viralityReason: `Crafted from prompt using ${style} visual direction, Ken Burns motion, and ${ttsResult.provider} narration.`,
      filePath: outputPath,
      urlPath: urlPath,
      thumbnailUrl: thumbnailUrl,
      aspectRatio: aspectRatio,
      framingMode: 'center',
      captionStyle: captionStyle,
      status: 'in_review',
      scheduledDate: null,
      scheduledTime: null,
      platforms: ['youtube', 'tiktok', 'instagram'],
      createdAt: new Date().toISOString(),
      approvedAt: null,
      publishedAt: null,
      prompt: prompt
    };

    db.addClip(newClip);
    db.addAuditLog('prompt_video_generated', `Generated dynamic video from prompt "${prompt}" (${aspectRatio}, ${finalDuration}s, [Voice: ${ttsResult.provider}])`);
    await webhookService.dispatch('clip.generated', newClip);

    return newClip;
  }

  /**
   * Generates tailored script and 4 scene visual prompts for any user prompt
   */
  private async generatePromptScript(prompt: string, targetDuration: number, language: string, style: string): Promise<any> {
    const aiPrompt = `You are a world-class viral video director creating a YouTube Short.
User Prompt: "${prompt}"
Visual Style: ${style}
Target Duration: ~${targetDuration} seconds.
Language: ${language}

Write an exciting, high-retention 4-part script with vivid visual prompts for each scene.
Return ONLY valid JSON matching this schema:
{
  "title": "Short Punchy Title (under 45 characters, curiosity-inducing)",
  "hook": "First 3-4 second spoken hook line (grabs attention instantly)",
  "scene1": "First surprising insight or setup (6-12 words)",
  "scene2": "The core revelation or secret (6-12 words)",
  "scene3": "The mind-blowing conclusion and call to action (6-12 words)",
  "fullNarration": "Complete spoken voiceover script flow (approximately 50-70 words spoken fluently)",
  "caption": "Platform-ready YouTube description with 4 high-traffic hashtags",
  "visualPrompts": [
    "Detailed visual description for scene 1 (hook)",
    "Detailed visual description for scene 2 (insight)",
    "Detailed visual description for scene 3 (secret)",
    "Detailed visual description for scene 4 (payoff/conclusion)"
  ],
  "viralityScore": 96
}`;

    const raw = await aiService.generateText(aiPrompt, 'You are an elite short-form video director. Return ONLY valid JSON.');
    if (raw) {
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.hook && parsed.fullNarration && Array.isArray(parsed.visualPrompts) && parsed.visualPrompts.length >= 4) {
          return parsed;
        }
      } catch (e) {
        console.warn('[Generator] LLM script parsing notice, building creative intelligent script');
      }
    }

    // Intelligent, Topic-Aware Creative Script Engine (Zero Cost, Offline, Highly Engaging)
    return this.buildCreativeHeuristicScript(prompt, targetDuration, style);
  }

  /**
   * Builds topic-specific creative scripts & vivid visual scene descriptions
   */
  private buildCreativeHeuristicScript(prompt: string, targetDuration: number, style: string) {
    const lower = prompt.toLowerCase();
    const cleanTitle = prompt.length > 40 ? prompt.slice(0, 38) + '...' : prompt;

    // 1. Food / Cooking / Restaurant / Recipe
    if (lower.includes('food') || lower.includes('cook') || lower.includes('recipe') || lower.includes('burger') || lower.includes('pasta') || lower.includes('pizza') || lower.includes('steak') || lower.includes('kitchen') || lower.includes('eat')) {
      return {
        title: `${cleanTitle}: The Secret Top Chefs Use`,
        hook: `This one kitchen secret will change the way you cook forever.`,
        scene1: `Most people rush the heat, but letting ingredients caramelize unlocks ten times more flavor.`,
        scene2: `The secret is balancing acidity and resting your food so every single bite stays juicy.`,
        scene3: `Try this on your very next meal and taste the extraordinary difference.`,
        fullNarration: `This one kitchen secret will change the way you cook forever. Most people rush the heat, but letting ingredients caramelize unlocks ten times more flavor. The secret is balancing acidity and resting your food so every single bite stays juicy. Try this on your very next meal and taste the extraordinary difference. Comment what dish you want broken down next!`,
        caption: `The golden culinary rule professional chefs never tell you. What is your go-to kitchen hack? #foodie #cooking #recipe #delicious #shorts`,
        visualPrompts: [
          `mouthwatering gourmet dish sizzling in cast iron pan with garlic herbs butter, cinematic 8k food photography`,
          `expert chef slicing fresh vibrant ingredients with knife on rustic wooden board, food commercial lighting`,
          `golden crispy caramelized crust sizzling with steam rising, delicious culinary close-up`,
          `magnificent Michelin-star plated gourmet dinner with sauce drizzle, luxury restaurant ambiance`
        ],
        viralityScore: 96
      };
    }

    // 2. Tech / AI / Future / Robotics / Coding
    if (lower.includes('ai') || lower.includes('tech') || lower.includes('robot') || lower.includes('code') || lower.includes('future') || lower.includes('computer') || lower.includes('software')) {
      return {
        title: `${cleanTitle}: The Shift Coming in 2026`,
        hook: `Nobody saw this coming, but this breakthrough is rewriting the future of technology.`,
        scene1: `Autonomous neural systems are leaping from experimental labs directly into everyday reality.`,
        scene2: `The real revolution is multimodal reasoning—systems that see, think, and execute in real-time.`,
        scene3: `The creators adopting this early will lead the next decade of innovation.`,
        fullNarration: `Nobody saw this coming, but this breakthrough is rewriting the future of technology. Autonomous neural systems are leaping from experimental labs directly into everyday reality. The real revolution is multimodal reasoning—systems that see, think, and execute in real-time. The creators adopting this early will lead the next decade of innovation. Subscribe to stay ahead of the curve!`,
        caption: `The silent technological revolution happening right now. Are you ready for what comes next? #tech #ai #innovation #future #shorts`,
        visualPrompts: [
          `futuristic humanoid robot with illuminated glass visor examining holographic blueprints, cinematic lighting`,
          `glowing neural network synapses pulsing with blue and violet data streams, 8k abstract tech render`,
          `cyberpunk city skyline with autonomous flying drones and neon skyscrapers, hyper-detailed`,
          `quantum processor chip glowing with brilliant cyan light in clean room, futuristic masterpiece`
        ],
        viralityScore: 97
      };
    }

    // 3. Space / Astronomy / Science / Mystery
    if (lower.includes('space') || lower.includes('black hole') || lower.includes('galaxy') || lower.includes('universe') || lower.includes('mars') || lower.includes('planet') || lower.includes('star') || lower.includes('physics')) {
      return {
        title: `${cleanTitle}: What Science Discovered`,
        hook: `If you ventured into deep space, this is the terrifying reality you would discover.`,
        scene1: `Beyond our solar system, gravitational anomalies bend light into impossible geometric illusions.`,
        scene2: `Near massive singularities, time itself slows down while entire eons flash by outside.`,
        scene3: `We are just beginning to scratch the surface of our unfathomably vast universe.`,
        fullNarration: `If you ventured into deep space, this is the terrifying reality you would discover. Beyond our solar system, gravitational anomalies bend light into impossible geometric illusions. Near massive singularities, time itself slows down while entire eons flash by outside. We are just beginning to scratch the surface of our unfathomably vast universe. Follow for daily cosmos secrets!`,
        caption: `The mind-bending physics of deep space. How small does this make you feel? #space #cosmos #universe #astronomy #shorts`,
        visualPrompts: [
          `supermassive black hole accretion disk bending starlight, interstellar cinematic 8k render`,
          `swirling cosmic nebula with luminous purple star dust and glowing exoplanets, James Webb photography`,
          `solitary astronaut in high-tech spacesuit floating above majestic ringed planet, cinematic lighting`,
          `hyper-speed interstellar warp tunnel with brilliant beams of starlight, epic science fiction`
        ],
        viralityScore: 95
      };
    }

    // 4. Psychology / Habits / Mindset / Life Hacks
    if (lower.includes('psychology') || lower.includes('mind') || lower.includes('habit') || lower.includes('respect') || lower.includes('brain') || lower.includes('focus') || lower.includes('trick') || lower.includes('secret')) {
      return {
        title: `${cleanTitle}: The Psychological Trick`,
        hook: `Here is the subtle psychology trick that instantly commands respect in any room.`,
        scene1: `Most people fill silences with nervous chatter, which immediately weakens their authority.`,
        scene2: `When someone asks a tough question, pausing for three deliberate seconds signals absolute control.`,
        scene3: `Practice this tomorrow and watch how quickly people adjust their posture around you.`,
        fullNarration: `Here is the subtle psychology trick that instantly commands respect in any room. Most people fill silences with nervous chatter, which immediately weakens their authority. When someone asks a tough question, pausing for three deliberate seconds signals absolute control. Practice this tomorrow and watch how quickly people adjust their posture around you. Save this for your next meeting!`,
        caption: `Subconscious psychology habits that command instant respect. Have you ever tried this? #psychology #mindset #confidence #success #shorts`,
        visualPrompts: [
          `confident elegant person maintaining calm intense eye contact in cinematic dramatic lighting, 8k portrait`,
          `glowing human brain illuminated with golden neural pathways, dark moody aesthetic`,
          `luxury modern boardroom with sharp silhouette of leader overlooking city lights at night`,
          `dramatic close-up of focused eyes reflecting brilliant golden light, cinematic 35mm film`
        ],
        viralityScore: 98
      };
    }

    // 5. Business / Money / Wealth / Finance
    if (lower.includes('money') || lower.includes('business') || lower.includes('wealth') || lower.includes('rich') || lower.includes('invest') || lower.includes('ceo') || lower.includes('costco') || lower.includes('sales')) {
      return {
        title: `${cleanTitle}: The Billion-Dollar Rule`,
        hook: `The top 1% never build wealth the way ordinary people are taught.`,
        scene1: `Trading your time for an hourly wage is a mathematical trap designed to keep you stuck.`,
        scene2: `True financial freedom comes from building scalable assets that work while you sleep.`,
        scene3: `Shift your focus from earning income to owning leverage, and your world changes forever.`,
        fullNarration: `The top 1% never build wealth the way ordinary people are taught. Trading your time for an hourly wage is a mathematical trap designed to keep you stuck. True financial freedom comes from building scalable assets that work while you sleep. Shift your focus from earning income to owning leverage, and your world changes forever. Follow to master the wealth game!`,
        caption: `The hidden wealth principle taught only to top entrepreneurs. What is your primary leverage? #money #wealth #business #finance #shorts`,
        visualPrompts: [
          `luxury modern penthouse overlooking illuminated city skyline at twilight, cinematic wealth aesthetic`,
          `golden financial charts and digital currency nodes rising into brilliant beam of light, 8k render`,
          `successful entrepreneur reviewing futuristic architecture plans in glass office, warm ambient light`,
          `bank vault door opening with glowing golden light streaming out, high contrast cinema photography`
        ],
        viralityScore: 94
      };
    }

    // 6. Universal Creative Fallback (Context-Aware)
    const topicWords = prompt.split(' ').slice(0, 3).join(' ');
    return {
      title: `${cleanTitle}: What You Never Knew`,
      hook: `Here is the unbelievable truth about ${topicWords} that almost nobody talks about.`,
      scene1: `What you see on the surface is only a tiny fraction of the real story unfolding.`,
      scene2: `Once you uncover the hidden pattern beneath it, everything suddenly clicks into place.`,
      scene3: `Keep this in mind and you will always be three steps ahead of the crowd.`,
      fullNarration: `Here is the unbelievable truth about ${topicWords} that almost nobody talks about. What you see on the surface is only a tiny fraction of the real story unfolding. Once you uncover the hidden pattern beneath it, everything suddenly clicks into place. Keep this in mind and you will always be three steps ahead of the crowd. Subscribe for more eye-opening breakdowns!`,
      caption: `The fascinating story behind ${cleanTitle}. Did you know about this? #insights #facts #curiosity #learning #shorts`,
      visualPrompts: [
        `dramatic cinematic visual representing ${prompt}, ultra detailed 8k photography, volumetric lighting`,
        `intricate glowing puzzle pieces and blueprints connecting together, hyper-detailed conceptual art`,
        `dramatic reveal of breakthrough idea with golden light shining through dark background, cinematic`,
        `epic wide cinematic landscape with inspiring sunrise glowing over horizon, award-winning shot`
      ],
      viralityScore: 93
    };
  }

  /**
   * Generates a multi-scene dynamic video using individual Ken Burns motion on each scene visual,
   * combined with neural voiceover, background audio bed, and burned kinetic subtitles.
   */
  private async renderMultiSceneVideo(params: {
    scriptPlan: any;
    duration: number;
    audioPath: string;
    outputPath: string;
    aspectRatio: '9:16' | '16:9';
    style: string;
    captionStyle: string;
    visualPrompts?: string[];
    musicBed?: boolean;
  }): Promise<string> {
    const { scriptPlan, duration, audioPath, outputPath, aspectRatio, style, captionStyle } = params;

    return new Promise(async (resolve, reject) => {
      const targetDir = path.dirname(outputPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const isVertical = aspectRatio === '9:16';
      const width = isVertical ? 1080 : 1920;
      const height = isVertical ? 1920 : 1080;

      // Calculate time per scene across 4 scenes
      const d0 = Math.max(3, Math.round(duration * 0.22));
      const d1 = Math.max(4, Math.round(duration * 0.28));
      const d2 = Math.max(4, Math.round(duration * 0.28));
      const d3 = Math.max(3, duration - d0 - d1 - d2);
      const sceneDurations = [d0, d1, d2, d3];

      const prompts = params.visualPrompts || [
        `${scriptPlan.title} dramatic cinematic visual`,
        `${scriptPlan.scene1} detailed action shot`,
        `${scriptPlan.scene2} surprising breakdown lighting`,
        `${scriptPlan.scene3} inspiring conclusion visual`
      ];

      console.log(`[Multi-Scene Engine] Fetching ${prompts.length} high-res scene visuals in parallel...`);
      const sceneImages = await Promise.all([
        stockMediaService.fetchSceneVisual({ prompt: prompts[0] || prompts[0], style, aspectRatio, sceneIndex: 0 }).catch(() => null),
        stockMediaService.fetchSceneVisual({ prompt: prompts[1] || prompts[0], style, aspectRatio, sceneIndex: 1 }).catch(() => null),
        stockMediaService.fetchSceneVisual({ prompt: prompts[2] || prompts[0], style, aspectRatio, sceneIndex: 2 }).catch(() => null),
        stockMediaService.fetchSceneVisual({ prompt: prompts[3] || prompts[0], style, aspectRatio, sceneIndex: 3 }).catch(() => null),
      ]);

      // Build Subtitle File
      const subFilename = `sub-kinetic-${Date.now()}.ass`;
      const subPath = path.join(targetDir, subFilename);

      let primaryColor = '&H0000FFFF'; // Bold Yellow (Default)
      if (captionStyle === 'karaoke-blue') primaryColor = '&H00FFFF00'; // Light Sky Blue (BGR)
      else if (captionStyle === 'minimal-white') primaryColor = '&H00FFFFFF';
      else if (captionStyle === 'red-alert') primaryColor = '&H000000FF';

      const fontSize = isVertical ? 64 : 52;
      const marginV = isVertical ? 460 : 140;

      const t1 = d0;
      const t2 = d0 + d1;
      const t3 = d0 + d1 + d2;

      const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const cs = Math.floor((sec % 1) * 100);
        return `0:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
      };

      const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Arial,${fontSize + 6},${primaryColor},&H00000000,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,6,3,2,50,50,${marginV},1
Style: Scene,Arial,${fontSize},&H00FFFFFF,&H00000000,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,6,3,2,50,50,${marginV},1
Style: CTA,Arial,${fontSize + 4},&H00FFA500,&H00000000,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,6,3,2,50,50,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,${formatTime(0)},${formatTime(t1)},Hook,,0,0,0,,{\\b1}${scriptPlan.hook.toUpperCase()}{\\b0}
Dialogue: 0,${formatTime(t1)},${formatTime(t2)},Scene,,0,0,0,,{\\b1}${scriptPlan.scene1.toUpperCase()}{\\b0}
Dialogue: 0,${formatTime(t2)},${formatTime(t3)},Scene,,0,0,0,,{\\b1}${scriptPlan.scene2.toUpperCase()}{\\b0}
Dialogue: 0,${formatTime(t3)},${formatTime(duration)},CTA,,0,0,0,,{\\b1}${(scriptPlan.scene3 || '').toUpperCase()}{\\b0}
`;
      fs.writeFileSync(subPath, assContent, 'utf-8');

      const escapedSub = subPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      const escapedAudio = audioPath.replace(/\\/g, '/');

      // Check if we have valid images to render Ken Burns motion
      const validImages = sceneImages.filter((img): img is string => img !== null && fs.existsSync(img));

      if (validImages.length > 0) {
        // High Quality Multi-Scene Ken Burns Render Pipeline
        const tempSceneFiles: string[] = [];
        console.log(`[Multi-Scene Engine] Rendering Ken Burns camera motion on ${validImages.length} scenes...`);

        try {
          for (let i = 0; i < 4; i++) {
            const imgPath = sceneImages[i] || validImages[i % validImages.length];
            const sceneDur = sceneDurations[i];
            const sceneOutputFile = path.join(targetDir, `temp_scene_${Date.now()}_${i}.mp4`);
            tempSceneFiles.push(sceneOutputFile);

            // Varied camera movement per scene
            let zoomFilter = '';
            if (i === 0) {
              // Scene 0 (Hook): Slow, dramatic zoom-in
              zoomFilter = `scale=1200:2133,zoompan=z='min(zoom+0.0014,1.22)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${sceneDur * 25}:s=${width}x${height}:fps=25`;
            } else if (i === 1) {
              // Scene 1: Smooth pan across
              zoomFilter = `scale=1300:2311,zoompan=z=1.15:x='(iw-iw/zoom)*(on/(${sceneDur * 25}))':y='ih/2-(ih/zoom/2)':d=${sceneDur * 25}:s=${width}x${height}:fps=25`;
            } else if (i === 2) {
              // Scene 2: Dynamic zoom-in
              zoomFilter = `scale=1200:2133,zoompan=z='min(zoom+0.0018,1.26)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${sceneDur * 25}:s=${width}x${height}:fps=25`;
            } else {
              // Scene 3: Subtle zoom-out
              zoomFilter = `scale=1200:2133,zoompan=z='if(lte(zoom,1.0),1.18,max(1.001,zoom-0.0012))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${sceneDur * 25}:s=${width}x${height}:fps=25`;
            }

            const escapedImg = imgPath.replace(/\\/g, '/');
            const sceneCmd = `ffmpeg -y -loop 1 -i "${escapedImg}" -t ${sceneDur} -vf "${zoomFilter}" -c:v libx264 -preset fast -pix_fmt yuv420p "${sceneOutputFile}"`;

            await new Promise<void>((resScene, rejScene) => {
              exec(sceneCmd, (err) => {
                if (err) return rejScene(err);
                resScene();
              });
            });
          }

          // Concat file list
          const concatListFile = path.join(targetDir, `concat_${Date.now()}.txt`);
          const concatContent = tempSceneFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
          fs.writeFileSync(concatListFile, concatContent, 'utf-8');

          console.log('[Multi-Scene Engine] Merging scenes with voiceover & burned kinetic captions...');
          const finalCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListFile.replace(/\\/g, '/')}" -i "${escapedAudio}" -t ${duration} -vf "ass='${escapedSub}'" -c:v libx264 -preset fast -crf 21 -c:a aac -b:a 128k "${outputPath}"`;

          const cleanupScratch = () => {
            try { if (fs.existsSync(concatListFile)) fs.unlinkSync(concatListFile); } catch (e) {}
            try { if (fs.existsSync(subPath)) fs.unlinkSync(subPath); } catch (e) {}
            tempSceneFiles.forEach(f => {
              try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
            });
            // Clean up temporary downloaded scene images and voiceover MP3 to preserve storage
            validImages.forEach(img => {
              try { if (fs.existsSync(img)) fs.unlinkSync(img); } catch (e) {}
            });
            if (audioPath && fs.existsSync(audioPath)) {
              try { fs.unlinkSync(audioPath); } catch (e) {}
            }
          };

          exec(finalCmd, (finalErr) => {
            if (finalErr) {
              console.error('[Multi-Scene Engine] Concat assembly failed, running safe fallback:', finalErr);
              const safeFallbackCmd = `ffmpeg -y -f lavfi -i "color=c=#0B1220:s=${width}x${height}:d=${duration}" -i "${escapedAudio}" -t ${duration} -c:v libx264 -c:a aac "${outputPath}"`;
              exec(safeFallbackCmd, (fbErr) => {
                cleanupScratch();
                if (fbErr) return reject(fbErr);
                resolve(outputPath);
              });
            } else {
              cleanupScratch();
              console.log(`[Multi-Scene Engine] Video generated successfully: ${outputPath}`);
              resolve(outputPath);
            }
          });
          return;
        } catch (sceneErr: any) {
          console.warn('[Multi-Scene Engine] Ken Burns generation error, applying single-visual fallback:', sceneErr.message);
        }
      }

      // Single-visual / Dynamic Canvas Fallback
      console.log('[Multi-Scene Engine] Using dynamic visual background fallback...');
      const fallbackCmd = `ffmpeg -y -f lavfi -i "color=c=#0B132B:s=${width}x${height}:d=${duration}" -i "${escapedAudio}" -t ${duration} -vf "drawbox=x=80:y=${isVertical ? 200 : 90}:w=${width - 160}:h=6:color=#2563EB@0.8:t=fill,drawtext=fontfile='/Windows/Fonts/arial.ttf':text='VIRAL SHORT':x=(w-text_w)/2:y=${isVertical ? 120 : 45}:fontsize=34:fontcolor=#93C5FD:box=1:boxcolor=#1E293B@0.85:boxborderw=10,ass='${escapedSub}'" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${outputPath}"`;

      exec(fallbackCmd, (fbErr) => {
        try { if (fs.existsSync(subPath)) fs.unlinkSync(subPath); } catch (e) {}
        if (audioPath && fs.existsSync(audioPath)) {
          try { fs.unlinkSync(audioPath); } catch (e) {}
        }
        if (fbErr) return reject(fbErr);
        resolve(outputPath);
      });
    });
  }

  private async generateScript(trend: LiveTrend, strategy: ContentStrategy, framework?: string): Promise<TrendScriptPlan> {
    const prompt = `You are a viral short-form video creator.
Topic: "${trend.title}"
Context: "${trend.snippet}"
Niche: "${strategy.niche}"
Target Audience: "${strategy.targetAudience}"
Language: "${strategy.language || 'English'}"
Tone: "${strategy.tone}"
Duration: ${strategy.durationSec}s.
Framework: ${framework || 'Problem-Agitate-Solve'}

Generate an original 4-scene short video script with visual prompts.
Return ONLY valid JSON matching this schema:
{
  "title": "Punchy Short Title (under 45 chars)",
  "hook": "First 3-second spoken hook line (curiosity-driven)",
  "scene1": "First insight (5-10 words)",
  "scene2": "The surprising breakdown (5-10 words)",
  "scene3": "The bottom-line takeaway (5-10 words)",
  "fullNarration": "Complete spoken voice-over script (approx 50 words)",
  "caption": "Platform-ready caption with 4 hashtags",
  "visualPrompts": [
    "Scene 1 hook visual description (cinematic)",
    "Scene 2 breakdown visual description",
    "Scene 3 surprise visual description",
    "Scene 4 resolution visual description"
  ],
  "viralityScore": 94
}`;

    const raw = await aiService.generateText(prompt, 'You are an elite short-form scriptwriter. Return ONLY valid JSON.');
    if (raw) {
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.hook && parsed.fullNarration) {
          return parsed;
        }
      } catch (e) {}
    }

    // Creative Heuristic Script Fallback
    const cleanNiche = strategy.niche || 'this space';
    const hook = `Nobody expected this update, but it completely disrupts ${cleanNiche}.`;
    const scene1 = `The critical news that just broke today overturned the conventional standard.`;
    const scene2 = `When you look at the underlying mechanics, a massive shift is already underway.`;
    const scene3 = `Here is the one move you need to make right now to stay ahead.`;

    return {
      title: `${trend.title.slice(0, 36)}: What It Means`,
      hook,
      scene1,
      scene2,
      scene3,
      fullNarration: `${hook} ${scene1} ${scene2} ${scene3} Subscribe for daily breakdowns!`,
      caption: `Breaking analysis on ${trend.title}. What are your thoughts on this? #${cleanNiche.replace(/\s+/g, '')} #trends #shorts #update`,
      visualPrompts: [
        `${trend.title} breaking news headline dramatic, 8k cinematic`,
        `analysts and researchers studying data breakdown, cinematic lighting`,
        `futuristic digital network connections glowing, hyper-detailed`,
        `high-impact conclusion reveal, cinematic lighting`
      ],
      viralityScore: 94
    };
  }

  /**
   * Enhances a basic user prompt into a high-engagement viral video blueprint
   */
  public async enhancePrompt(prompt: string, niche?: string): Promise<{ enhancedPrompt: string; suggestedStyle: string; suggestedDuration: number }> {
    const aiPrompt = `Enhance this simple user video prompt into a high-retention viral video prompt:
Prompt: "${prompt}"
Niche: "${niche || 'General'}"

Return ONLY valid JSON:
{
  "enhancedPrompt": "Expanded, highly engaging prompt with hook angle and visual scenes",
  "suggestedStyle": "cinematic" (choose from cinematic, kinetic, editorial, neon, mouthwatering),
  "suggestedDuration": 30
}`;

    const raw = await aiService.generateText(aiPrompt);
    if (raw) {
      try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.enhancedPrompt) return parsed;
      } catch (e) {}
    }

    return {
      enhancedPrompt: `Create an ultra-high-retention video exposing the critical breakthrough behind ${prompt}. Break it down into 3 fast-paced insights with visual evidence and a powerful conclusion.`,
      suggestedStyle: 'cinematic',
      suggestedDuration: 30
    };
  }
}

export const trendVideoGenerator = new TrendVideoGenerator();
