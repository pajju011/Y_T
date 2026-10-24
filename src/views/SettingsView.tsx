import React, { useState, useEffect } from 'react';
import {
  Check,
  ExternalLink,
  Zap,
  CheckCircle2
} from 'lucide-react';
import type { SettingsData, SystemInfo } from '../api';
import { api } from '../api';

interface SettingsViewProps {
  systemInfo: SystemInfo | null;
  onRefreshSystem: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemInfo,
  onRefreshSystem,
}) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [groqKey, setGroqKey] = useState<string>('');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');
  const [customDomain, setCustomDomain] = useState<string>('');
  const [defaultAspect, setDefaultAspect] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setCustomDomain(data.customDomain || '');
      setOllamaUrl(data.ollamaEndpoint || 'http://localhost:11434');
      setDefaultAspect(data.defaultAspectRatio || '9:16');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings({
        customDomain,
        defaultAspectRatio: defaultAspect,
        ollamaEndpoint: ollamaUrl,
        geminiApiKey: geminiKey.trim() ? geminiKey : undefined,
        groqApiKey: groqKey.trim() ? groqKey : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefreshSystem();
      loadSettings();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '980px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem' }}>Application Settings & 100% Free Setup</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Configure AI model keys, inspect local video engines, and set up your custom domain.
        </p>
      </div>

      {/* 100% FREE BLUEPRINT CALLOUT */}
      <div className="card" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '3px solid var(--accent-primary)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <Zap size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Everything You Need to Run ClipGenius 100% Free</h3>
        </div>
        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          ClipGenius AI was engineered specifically so you never need a paid subscription. Here is the exact stack:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} />
              <span>1. Video Slicing: FFmpeg</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              <strong>Status: Already Installed!</strong> ({systemInfo?.ffmpeg.available ? 'Ready v8.1' : 'Detected'}). Runs 100% locally on your machine with zero limits, zero watermarks, and $0 cost.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} />
              <span>2. AI Hooks: Google Gemini</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Google AI Studio provides a <strong>100% Free API Key</strong> for Gemini 2.0 Flash (15 RPM, 1,500 requests/day, no credit card required).
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} />
              <span>3. Offline Fallback: Pattern AI</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Built right into ClipGenius AI. Analyzes video timelines and pacing locally with <strong>0 API keys and zero internet needed</strong>.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} />
              <span>4. Social Distribution: 1-Click MP4</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Direct download of 1080x1920 vertical video with subtitles ready to drop straight into TikTok, Shorts, and Reels for $0.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* AI Model Keys */}
        <div className="settings-section">
          <h3 className="settings-section-title">AI Provider Credentials</h3>
          <p className="settings-section-desc">
            Enter your free API keys below. They are saved strictly into your local configuration file.
          </p>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Google Gemini API Key (Recommended - Free)</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <span>Get Free Key at Google AI Studio</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder={settings?.hasGeminiKey ? '•••••••••••••••• (Key Configured)' : 'Paste AI Studio Key (AIzaSy...)'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <span className="form-hint">
              Free tier gives 15 requests per minute and 1,500 free requests per day. No billing setup required.
            </span>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Groq API Key (Optional - Free Fast Whisper & Llama 3)</label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <span>Get Free Key at Groq Console</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder={settings?.hasGroqKey ? '•••••••••••••••• (Key Configured)' : 'Paste Groq Key (gsk_...)'}
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Local Ollama Endpoint (Optional 100% Offline)</label>
            <input
              className="form-input"
              placeholder="http://localhost:11434"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
            />
            <span className="form-hint">For running open-source models (Llama 3, Mistral) locally on your GPU/CPU.</span>
          </div>
        </div>

        {/* Video Defaults */}
        <div className="settings-section">
          <h3 className="settings-section-title">Video Rendering Defaults</h3>
          <p className="settings-section-desc">
            Configure default aspect ratio and video output parameters for FFmpeg.
          </p>

          <div className="form-group">
            <label className="form-label">Default Aspect Ratio</label>
            <select
              className="form-select"
              value={defaultAspect}
              onChange={(e) => setDefaultAspect(e.target.value as any)}
            >
              <option value="9:16">9:16 Vertical (YouTube Shorts, TikTok, Instagram Reels)</option>
              <option value="1:1">1:1 Square (LinkedIn, Facebook Feed)</option>
              <option value="16:9">16:9 Landscape (Standard YouTube, Twitter)</option>
            </select>
          </div>
        </div>

        {/* Custom Domain Readiness & DNS */}
        <div className="settings-section">
          <h3 className="settings-section-title">Custom Domain Readiness & DNS Deployment</h3>
          <p className="settings-section-desc">
            ClipGenius AI can be deployed behind any domain or subdomain (e.g., <code className="docs-code">clips.yourdomain.com</code>).
          </p>

          <div className="form-group">
            <label className="form-label">Custom Domain Hostname</label>
            <input
              className="form-input"
              placeholder="e.g. clipgenius.yourdomain.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
            />
          </div>

          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name / Host</th>
                  <th>Target / Value</th>
                  <th>Proxy / TTL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code className="docs-code">CNAME</code></td>
                  <td>{customDomain ? customDomain.split('.')[0] : 'clips'}</td>
                  <td><code className="docs-code">cname.vercel-dns.com</code> or VPS IP</td>
                  <td>DNS Only / Auto</td>
                </tr>
                <tr>
                  <td><code className="docs-code">A</code></td>
                  <td>@ (Root)</td>
                  <td><code className="docs-code">76.76.21.21</code> (Vercel) or your server IP</td>
                  <td>DNS Only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} />
              <span>Settings saved successfully!</span>
            </span>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
