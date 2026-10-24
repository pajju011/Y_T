import { db } from './db.js';
import { trendDiscoveryService } from './trends.js';
import { trendVideoGenerator } from './generator.js';

export class AutomationEngine {
  private isRunning: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Run an initial check after 15 seconds, then every 3 hours
    setTimeout(() => this.runScheduledCheck(), 15000);
    this.intervalTimer = setInterval(() => this.runScheduledCheck(), 3 * 60 * 60 * 1000);
  }

  /**
   * Executes the daily pipeline check
   */
  public async runScheduledCheck() {
    const strategy = db.getStrategy();
    if (!strategy || !strategy.autoPrepareDaily) {
      console.log('[Daily Automation] Auto-prepare disabled in Content Strategy.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (strategy.lastAutoRun && strategy.lastAutoRun.startsWith(todayStr)) {
      console.log('[Daily Automation] Video already prepared for today (' + todayStr + '). Quota met.');
      return;
    }

    console.log(`[Daily Automation] Starting daily content preparation for niche "${strategy.niche}"...`);
    await this.runPipelineNow();
  }

  /**
   * Runs the complete autonomous pipeline on-demand
   */
  public async runPipelineNow() {
    if (this.isRunning) {
      console.warn('[Daily Automation] Pipeline already in progress.');
      return;
    }

    this.isRunning = true;
    const strategy = db.getStrategy();

    try {
      // 1. Discover Fresh Live Trends
      const liveTrends = await trendDiscoveryService.discoverTrends(strategy.niche, strategy.keywords);
      if (liveTrends.length === 0) {
        console.warn('[Daily Automation] No fresh trends discovered.');
        return;
      }

      // 2. Select Highest Relevance Candidate that hasn't been generated yet
      const candidate = liveTrends[0];
      console.log(`[Daily Automation] Selected top trend: "${candidate.title}" (Score: ${candidate.relevanceScore})`);

      // 3. Generate 9:16 Vertical Video (Text-To-Video)
      const newClip = await trendVideoGenerator.generateTrendVideo(candidate, strategy);

      // 4. Update last auto-run timestamp
      db.updateStrategy({ lastAutoRun: new Date().toISOString() });
      db.addAuditLog('daily_automation_complete', `Daily trend video "${newClip.title}" generated and placed in Review & Approvals.`);
      console.log(`[Daily Automation] Complete! New clip "${newClip.title}" waiting for manual creator approval.`);
    } catch (err: any) {
      console.error('[Daily Automation] Pipeline error:', err);
      db.addAuditLog('daily_automation_error', `Pipeline failed: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  public getStatus() {
    const strategy = db.getStrategy();
    return {
      autoPrepareDaily: strategy.autoPrepareDaily,
      lastAutoRun: strategy.lastAutoRun,
      niche: strategy.niche,
      dailyVideoLimit: strategy.dailyVideoLimit,
      isRunning: this.isRunning
    };
  }
}

export const automationEngine = new AutomationEngine();
