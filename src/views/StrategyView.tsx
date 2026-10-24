import React, { useState, useEffect } from 'react';
import {
  Play,
  Save,
  Check,
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
  Layers,
  Globe,
  Radio
} from 'lucide-react';
import type { ContentStrategy, AuditLog } from '../api';
import { api } from '../api';
import type { ActiveTab } from '../components/Sidebar';

interface StrategyViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onRefreshAll: () => Promise<void>;
}

export const StrategyView: React.FC<StrategyViewProps> = ({ setActiveTab, onRefreshAll }) => {
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [channelName, setChannelName] = useState<string>('');
  const [niche, setNiche] = useState<string>('Tech & AI');
  const [keywordsText, setKeywordsText] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [targetRegion, setTargetRegion] = useState<string>('Global / US');
  const [language, setLanguage] = useState<string>('English');
  const [tone, setTone] = useState<string>('Informed, concise, analytical, engaging');
  const [durationSec, setDurationSec] = useState<number>(30);
  const [dailyLimit, setDailyLimit] = useState<number>(1);
  const [autoPrepareDaily, setAutoPrepareDaily] = useState<boolean>(true);
  const [platforms, setPlatforms] = useState<('youtube' | 'tiktok' | 'instagram' | 'linkedin')[]>(['youtube', 'tiktok']);
  const [visualMode, setVisualMode] = useState<'motion_text' | 'template'>('motion_text');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [pipelineSuccess, setPipelineSuccess] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadStrategy();
    loadAuditLogs();
  }, []);

  const loadStrategy = async () => {
    try {
      const data = await api.getStrategy();
      setStrategy(data);
      setChannelName(data.channelName || '');
      setNiche(data.niche || 'Tech & AI');
      setKeywordsText((data.keywords || []).join(', '));
      setTargetAudience(data.targetAudience || '');
      setTargetRegion(data.targetRegion || 'Global / US');
      setLanguage(data.language || 'English');
      setTone(data.tone || 'Informed, concise, analytical, engaging');
      setDurationSec(data.durationSec || 30);
      setDailyLimit(data.dailyVideoLimit || 1);
      setAutoPrepareDaily(data.autoPrepareDaily);
      setPlatforms(data.preferredPlatforms || ['youtube', 'tiktok']);
      setVisualMode(data.visualMode || 'motion_text');
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs.slice(0, 6));
    } catch (e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const kw = keywordsText.split(',').map(s => s.trim()).filter(Boolean);
      const updated = await api.updateStrategy({
        channelName,
        niche,
        keywords: kw,
        targetAudience,
        targetRegion,
        language,
        tone,
        durationSec,
        dailyVideoLimit: dailyLimit,
        autoPrepareDaily,
        preferredPlatforms: platforms,
        visualMode,
      });
      setStrategy(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await loadAuditLogs();
    } catch (err: any) {
      alert(`Failed to save strategy: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    setPipelineSuccess(null);
    try {
      const res = await api.runAutomationNow();
      setPipelineSuccess(res.message || 'Pipeline complete! A fresh draft video is ready for your review.');
      await onRefreshAll();
      await loadStrategy();
      await loadAuditLogs();
    } catch (err: any) {
      alert(`Pipeline execution error: ${err.message}`);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const togglePlatform = (p: 'youtube' | 'tiktok' | 'instagram' | 'linkedin') => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter(x => x !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px' }}>
      {/* Header with Direct Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>AI Trend Studio — Content Strategy & Daily Automation</h2>
            <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#93c5fd', borderColor: 'var(--accent-border)' }}>
              Module B
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Configure channel persona, niche keywords, target audience, and language. The background runner automatically generates 1 ready-to-review draft video per day with $0 cost.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRunPipeline}
          disabled={isRunningPipeline}
          title="Discovers latest trends right now and creates a fresh 9:16 draft video in Approvals"
        >
          {isRunningPipeline ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Running Trend Pipeline...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Run Daily Pipeline Now</span>
            </>
          )}
        </button>
      </div>

      {pipelineSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: 'var(--success-subtle)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', color: '#6ee7b7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} />
            <span>{pipelineSuccess}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('approvals')} style={{ color: '#ffffff' }}>
            <span>Open Review Queue</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Autonomous Guardrails Callout with Last Run Info */}
      <div className="card" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '3px solid var(--accent-primary)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Human-in-the-Loop Governance Standard</h3>
          </div>
          {strategy?.lastAutoRun && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Clock size={13} />
              <span>Last Daily Run: {new Date(strategy.lastAutoRun).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Even with daily automation enabled, <strong>no video is ever published automatically</strong>. All generated trend videos enter the <strong>Review & Approvals</strong> queue with status <code className="docs-code">in_review</code> until you review the burned-in captions, audio, and metadata, and click Approve or Publish.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Channel Profile & Audience */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 className="settings-section-title" style={{ margin: 0 }}>1. Channel Profile & Niche Alignment</h3>
          </div>
          <p className="settings-section-desc">
            Define your audience profile and the topic boundaries for autonomous trend discovery.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Channel / Project Name</label>
              <input
                className="form-input"
                placeholder="e.g. FutureTech Daily"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Core Niche</label>
              <select
                className="form-select"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              >
                <option value="Tech & AI">Tech & Artificial Intelligence</option>
                <option value="Finance & Business">Finance, Markets & Business</option>
                <option value="Productivity">Productivity & Software Systems</option>
                <option value="Creator Economy">Creator Economy & Marketing</option>
                <option value="Gaming">Gaming & Digital Culture</option>
                <option value="Science & Future">Science, Space & Discoveries</option>
                <option value="Education">Facts, History & Education</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Focus Keywords & Topics (Comma-separated)</label>
            <input
              className="form-input"
              placeholder="e.g. Artificial Intelligence, Software Engineering, Productivity Tools"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
            />
            <span className="form-hint">Used by Google News and RSS parsers to filter and score trending candidate articles.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <input
                className="form-input"
                placeholder="e.g. Tech professionals, startup founders, curious builders"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content Tone & Style</label>
              <select
                className="form-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Informed, concise, analytical, engaging">Informed, concise, analytical & engaging</option>
                <option value="Fast-paced, energetic, high-curiosity">Fast-paced, energetic & curiosity-driven</option>
                <option value="Storyteller, conversational, relatable">Storyteller, conversational & relatable</option>
                <option value="Contrarian, critical, thought-provoking">Contrarian & thought-provoking</option>
                <option value="Authoritative, executive, data-backed">Authoritative, executive & data-backed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Content Language</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </select>
              <span className="form-hint">Language used for AI script narration and burned-in captions.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Target Geographic Region</label>
              <select
                className="form-select"
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
              >
                <option value="Global / US">Global / North America (US/CA)</option>
                <option value="UK & Europe">United Kingdom & Europe</option>
                <option value="Asia Pacific">Asia Pacific & India</option>
                <option value="Latin America">Latin America</option>
              </select>
              <span className="form-hint">Calibrates regional RSS search and posting time zone alignment.</span>
            </div>
          </div>
        </div>

        {/* Section 2: Video Format & Autonomous Limits */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Layers size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 className="settings-section-title" style={{ margin: 0 }}>2. Video Format & Autonomous Limits</h3>
          </div>
          <p className="settings-section-desc">
            Define daily generation frequency, output length, and target social platforms.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Video Duration</label>
              <select
                className="form-select"
                value={durationSec}
                onChange={(e) => setDurationSec(parseInt(e.target.value, 10))}
              >
                <option value={15}>15 Seconds (Rapid Discovery)</option>
                <option value={30}>30 Seconds (Optimal Shorts/Reels)</option>
                <option value={60}>60 Seconds (Deep-Dive Analysis)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Daily Video Limit</label>
              <select
                className="form-select"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value, 10))}
              >
                <option value={1}>1 Video / Day (Recommended)</option>
                <option value={2}>2 Videos / Day</option>
                <option value={3}>3 Videos / Day</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Autonomous Background Runner</label>
              <select
                className="form-select"
                value={autoPrepareDaily ? 'enabled' : 'disabled'}
                onChange={(e) => setAutoPrepareDaily(e.target.value === 'enabled')}
              >
                <option value="enabled">Enabled (Auto-prepare draft video daily)</option>
                <option value="disabled">Disabled (Manual trigger only)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">Visual Style Mode (Text-to-Video)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              <div
                className={`card ${visualMode === 'motion_text' ? 'active-border' : ''}`}
                style={{ cursor: 'pointer', padding: '0.85rem' }}
                onClick={() => setVisualMode('motion_text')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Radio size={14} style={{ color: 'var(--accent-primary)' }} />
                  <strong style={{ fontSize: '0.875rem' }}>Kinetic Typography & Slate Gradient</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                  High-contrast dynamic text with burned-in yellow hooks and scene breakdowns over a 9:16 slate canvas.
                </p>
              </div>

              <div
                className={`card ${visualMode === 'template' ? 'active-border' : ''}`}
                style={{ cursor: 'pointer', padding: '0.85rem' }}
                onClick={() => setVisualMode('template')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Globe size={14} style={{ color: 'var(--accent-primary)' }} />
                  <strong style={{ fontSize: '0.875rem' }}>Minimalist Editorial & Badges</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Clean newsroom style with verified source header banner, timeline markers, and bold caption cards.
                </p>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">Target Publishing Platforms</label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {(['youtube', 'tiktok', 'instagram', 'linkedin'] as const).map((p) => {
                const isSelected = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => togglePlatform(p)}
                  >
                    <span>{p === 'youtube' ? 'YouTube Shorts' : p.charAt(0).toUpperCase() + p.slice(1)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} />
              <span>Strategy saved successfully!</span>
            </span>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Strategy'}</span>
          </button>
        </div>
      </form>

      {/* Audit Logs */}
      {auditLogs.length > 0 && (
        <section aria-labelledby="audit-logs-heading">
          <h3 id="audit-logs-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Autonomous Pipeline Activity Log
          </h3>
          <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {log.action}
                    </span>
                    <span>{log.details}</span>
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
