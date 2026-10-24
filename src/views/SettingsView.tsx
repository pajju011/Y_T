import React, { useState, useEffect } from 'react';
import {
  Check,
  ExternalLink,
  Zap,
  Sparkles,
  Mic,
  Video,
  Share2,
  Loader2,
  CheckCircle
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

  // LLM State
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [groqKey, setGroqKey] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');
  const [customLlmUrl, setCustomLlmUrl] = useState<string>('');
  const [customLlmKey, setCustomLlmKey] = useState<string>('');
  const [customLlmModel, setCustomLlmModel] = useState<string>('gpt-4o-mini');
  const [preferredLlm, setPreferredLlm] = useState<string>('gemini');

  // TTS State
  const [elevenLabsKey, setElevenLabsKey] = useState<string>('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [openaiTtsVoice, setOpenaiTtsVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('alloy');
  const [deepgramKey, setDeepgramKey] = useState<string>('');
  const [preferredTts, setPreferredTts] = useState<string>('none');

  // Media State
  const [pexelsKey, setPexelsKey] = useState<string>('');
  const [pixabayKey, setPixabayKey] = useState<string>('');
  const [mediaStyle, setMediaStyle] = useState<'stock_video' | 'motion_gradient' | 'minimal_slate'>('motion_gradient');

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string>('');
  const [webhookEnabled, setWebhookEnabled] = useState<boolean>(false);

  // General State
  const [customDomain, setCustomDomain] = useState<string>('');
  const [defaultAspect, setDefaultAspect] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Testing States
  const [isTestingLlm, setIsTestingLlm] = useState<boolean>(false);
  const [llmTestResult, setLlmTestResult] = useState<string | null>(null);
  const [isTestingTts, setIsTestingTts] = useState<boolean>(false);
  const [ttsTestResult, setTtsTestResult] = useState<string | null>(null);
  const [isTestingMedia, setIsTestingMedia] = useState<boolean>(false);
  const [mediaTestResult, setMediaTestResult] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setPreferredLlm(data.preferredLlmProvider || 'gemini');
      setOllamaUrl(data.ollamaEndpoint || 'http://localhost:11434');
      setCustomLlmUrl(data.customLlmEndpoint || '');
      setCustomLlmModel(data.customLlmModel || 'gpt-4o-mini');

      setPreferredTts(data.preferredTtsProvider || 'none');
      setElevenLabsVoiceId(data.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM');
      setOpenaiTtsVoice(data.openaiTtsVoice || 'alloy');

      setMediaStyle(data.mediaStyle || 'motion_gradient');

      setWebhookUrl(data.webhookUrl || '');
      setWebhookSecret(data.webhookSecret || '');
      setWebhookEnabled(data.webhookEnabled || false);

      setCustomDomain(data.customDomain || '');
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
        preferredLlmProvider: preferredLlm as any,
        ollamaEndpoint: ollamaUrl,
        customLlmEndpoint: customLlmUrl,
        customLlmModel,
        geminiApiKey: geminiKey.trim() ? geminiKey : undefined,
        openaiApiKey: openaiKey.trim() ? openaiKey : undefined,
        anthropicApiKey: anthropicKey.trim() ? anthropicKey : undefined,
        groqApiKey: groqKey.trim() ? groqKey : undefined,
        deepseekApiKey: deepseekKey.trim() ? deepseekKey : undefined,
        customLlmKey: customLlmKey.trim() ? customLlmKey : undefined,

        preferredTtsProvider: preferredTts as any,
        elevenLabsVoiceId,
        openaiTtsVoice,
        elevenLabsApiKey: elevenLabsKey.trim() ? elevenLabsKey : undefined,
        deepgramApiKey: deepgramKey.trim() ? deepgramKey : undefined,

        mediaStyle,
        pexelsApiKey: pexelsKey.trim() ? pexelsKey : undefined,
        pixabayApiKey: pixabayKey.trim() ? pixabayKey : undefined,

        webhookUrl,
        webhookSecret: webhookSecret.trim() ? webhookSecret : undefined,
        webhookEnabled,

        customDomain,
        defaultAspectRatio: defaultAspect
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefreshSystem();
      loadSettings();
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const testLlmConnection = async () => {
    setIsTestingLlm(true);
    setLlmTestResult(null);
    try {
      const res = await api.testLlm();
      if (res.success) {
        setLlmTestResult(`Success: "${res.response}"`);
      } else {
        setLlmTestResult(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setLlmTestResult(`Failed: ${err.message}`);
    } finally {
      setIsTestingLlm(false);
    }
  };

  const testTtsEngine = async () => {
    setIsTestingTts(true);
    setTtsTestResult(null);
    try {
      const res = await api.testTts();
      if (res.success) {
        setTtsTestResult(`Generated sample via ${res.provider} (${res.duration?.toFixed(1)}s audio ready)`);
      } else {
        setTtsTestResult(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setTtsTestResult(`Failed: ${err.message}`);
    } finally {
      setIsTestingTts(false);
    }
  };

  const testMediaSearch = async () => {
    setIsTestingMedia(true);
    setMediaTestResult(null);
    try {
      const res = await api.testMedia('artificial intelligence');
      setMediaTestResult(res.message);
    } catch (err: any) {
      setMediaTestResult(`Failed: ${err.message}`);
    } finally {
      setIsTestingMedia(false);
    }
  };

  const testWebhookDispatch = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await api.testWebhook();
      if (res.success) {
        setWebhookTestResult(res.message || 'Webhook delivered 200 OK');
      } else {
        setWebhookTestResult(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setWebhookTestResult(`Failed: ${err.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '980px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem' }}>API & Automation Hub</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Configure any LLM, text-to-speech voice engine, stock media API, or webhook automations to power fully hands-free video production.
        </p>
      </div>

      {/* 100% Free Blueprint Callout */}
      <div className="card" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '3px solid var(--accent-primary)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Bring Your Own API Keys — Or Run 100% Free</h3>
          </div>
          {systemInfo?.ffmpeg.available && (
            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={12} />
              <span>Local FFmpeg: v8.1 Ready</span>
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
          Every feature in ClipGenius AI has a $0 built-in fallback (local FFmpeg rendering, offline heuristics, ambient beds). Entering any API key below instantly upgrades that component to cloud-scale intelligence.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* 1. LLM & Brain Section */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="settings-section-title" style={{ margin: 0 }}>1. AI Scriptwriting & Brain (LLM)</h3>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={testLlmConnection}
              disabled={isTestingLlm}
            >
              {isTestingLlm ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              <span>Test LLM Connection</span>
            </button>
          </div>
          <p className="settings-section-desc">
            Used to analyze video highlights, craft curiosity hooks, and generate original multi-scene scripts.
          </p>

          {llmTestResult && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', backgroundColor: llmTestResult.startsWith('Success') ? 'var(--success-subtle)' : 'rgba(239, 68, 68, 0.12)', color: llmTestResult.startsWith('Success') ? '#6ee7b7' : '#fca5a5', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              {llmTestResult}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Google Gemini */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Google Gemini API Key (100% Free)</label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>Get Free Key</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasGeminiKey ? '•••••••••••••••• (Configured)' : 'AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <span className="form-hint">Google AI Studio offers 1,500 free requests/day with no card required.</span>
            </div>

            {/* Groq */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Groq API Key (Free Fast Llama 3.3 70B)</label>
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>Get Free Key</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasGroqKey ? '•••••••••••••••• (Configured)' : 'gsk_...'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
              />
            </div>

            {/* OpenAI */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">OpenAI API Key (GPT-4o / GPT-4o-mini)</label>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>OpenAI Keys</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasOpenAiKey ? '•••••••••••••••• (Configured)' : 'sk-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>

            {/* Anthropic Claude */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Anthropic Claude API Key</label>
                <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>Anthropic Keys</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasAnthropicKey ? '•••••••••••••••• (Configured)' : 'sk-ant-...'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
            </div>

            {/* DeepSeek */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">DeepSeek API Key (V3 / R1)</label>
                <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>DeepSeek Keys</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasDeepseekKey ? '•••••••••••••••• (Configured)' : 'sk-...'}
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
              />
            </div>

            {/* Custom OpenAI-Compatible */}
            <div className="form-group">
              <label className="form-label">Custom OpenAI-Compatible Endpoint</label>
              <input
                className="form-input"
                placeholder="https://api.together.xyz/v1 or http://localhost:1234/v1"
                value={customLlmUrl}
                onChange={(e) => setCustomLlmUrl(e.target.value)}
              />
              <span className="form-hint">Connect any custom endpoint (LMStudio, vLLM, OpenRouter, LocalAI).</span>
            </div>

            <div className="form-group">
              <label className="form-label">Custom Endpoint API Key (Optional)</label>
              <input
                type="password"
                className="form-input"
                placeholder="API Key for custom endpoint"
                value={customLlmKey}
                onChange={(e) => setCustomLlmKey(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 2. Voice Narration & TTS Section */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mic size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="settings-section-title" style={{ margin: 0 }}>2. AI Voice Narration & Speech (TTS)</h3>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={testTtsEngine}
              disabled={isTestingTts}
            >
              {isTestingTts ? <Loader2 size={13} className="animate-spin" /> : <Mic size={13} />}
              <span>Test Voiceover Sample</span>
            </button>
          </div>
          <p className="settings-section-desc">
            Turns video scripts into natural spoken human voiceovers for vertical text-to-video production.
          </p>

          {ttsTestResult && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', backgroundColor: 'var(--success-subtle)', color: '#6ee7b7', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              {ttsTestResult}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* ElevenLabs */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">ElevenLabs API Key</label>
                <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>ElevenLabs Portal</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasElevenLabsKey ? '•••••••••••••••• (Configured)' : 'Paste ElevenLabs Key'}
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
              />
            </div>

            {/* ElevenLabs Voice ID */}
            <div className="form-group">
              <label className="form-label">ElevenLabs Voice ID</label>
              <input
                className="form-input"
                placeholder="21m00Tcm4TlvDq8ikWAM (Rachel)"
                value={elevenLabsVoiceId}
                onChange={(e) => setElevenLabsVoiceId(e.target.value)}
              />
              <span className="form-hint">Default: 21m00Tcm4TlvDq8ikWAM (Rachel) or paste any Voice Library ID.</span>
            </div>

            {/* OpenAI Voice */}
            <div className="form-group">
              <label className="form-label">OpenAI TTS Voice (Uses OpenAI Key)</label>
              <select
                className="form-select"
                value={openaiTtsVoice}
                onChange={(e) => setOpenaiTtsVoice(e.target.value as any)}
              >
                <option value="alloy">Alloy (Balanced & Versatile)</option>
                <option value="echo">Echo (Warm & Authoritative)</option>
                <option value="fable">Fable (Expressive & British accent)</option>
                <option value="onyx">Onyx (Deep & Confident)</option>
                <option value="nova">Nova (Energetic & Dynamic)</option>
                <option value="shimmer">Shimmer (Clear & Engaging)</option>
              </select>
            </div>

            {/* Deepgram */}
            <div className="form-group">
              <label className="form-label">Deepgram Aura API Key (Optional)</label>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasDeepgramKey ? '•••••••••••••••• (Configured)' : 'Deepgram Token'}
                value={deepgramKey}
                onChange={(e) => setDeepgramKey(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 3. Stock Media & Background Video Section */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Video size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="settings-section-title" style={{ margin: 0 }}>3. Stock Video & Background Footage</h3>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={testMediaSearch}
              disabled={isTestingMedia}
            >
              {isTestingMedia ? <Loader2 size={13} className="animate-spin" /> : <Video size={13} />}
              <span>Test Video Search</span>
            </button>
          </div>
          <p className="settings-section-desc">
            Automatically finds real 9:16 vertical video clips matching your trend topics for rich multi-scene backgrounds.
          </p>

          {mediaTestResult && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', backgroundColor: 'var(--success-subtle)', color: '#6ee7b7', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              {mediaTestResult}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Pexels */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Pexels API Key (100% Free Stock Video)</label>
                <a href="https://www.pexels.com/api/" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>Get Free Pexels Key</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasPexelsKey ? '•••••••••••••••• (Configured)' : 'Pexels API Key'}
                value={pexelsKey}
                onChange={(e) => setPexelsKey(e.target.value)}
              />
              <span className="form-hint">Free Pexels API provides 200 requests/hour to fetch real vertical 9:16 video clips.</span>
            </div>

            {/* Pixabay */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Pixabay API Key (Free Stock Footage)</label>
                <a href="https://pixabay.com/api/docs/" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>Get Free Pixabay Key</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={settings?.hasPixabayKey ? '•••••••••••••••• (Configured)' : 'Pixabay API Key'}
                value={pixabayKey}
                onChange={(e) => setPixabayKey(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 4. Webhook & Automation Section */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="settings-section-title" style={{ margin: 0 }}>4. Webhook & Pipeline Automations</h3>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={testWebhookDispatch}
              disabled={isTestingWebhook || !webhookUrl}
            >
              {isTestingWebhook ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
              <span>Send Test Webhook Ping</span>
            </button>
          </div>
          <p className="settings-section-desc">
            Trigger custom external automations (Zapier, Make.com, n8n, Discord, Telegram, or custom web servers) whenever videos are generated or approved.
          </p>

          {webhookTestResult && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', backgroundColor: webhookTestResult.includes('OK') ? 'var(--success-subtle)' : 'rgba(239, 68, 68, 0.12)', color: webhookTestResult.includes('OK') ? '#6ee7b7' : '#fca5a5', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              {webhookTestResult}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Webhook Destination URL</label>
              <input
                className="form-input"
                placeholder="https://hooks.zapier.com/hooks/catch/... or n8n URL"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <span className="form-hint">Receives POST JSON payloads for events: <code className="docs-code">clip.generated</code>, <code className="docs-code">clip.approved</code>, <code className="docs-code">video.published</code>.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Webhook Secret Token (Optional)</label>
              <input
                type="password"
                className="form-input"
                placeholder="Custom secret sent in X-ClipGenius-Secret header"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              id="webhook-toggle"
              checked={webhookEnabled}
              onChange={(e) => setWebhookEnabled(e.target.checked)}
            />
            <label htmlFor="webhook-toggle" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
              Enable active webhook dispatch on clip generation and approval
            </label>
          </div>
        </div>

        {/* 5. Custom Domain & DNS */}
        <div className="settings-section">
          <h3 className="settings-section-title">5. Custom Domain Readiness & DNS</h3>
          <p className="settings-section-desc">
            ClipGenius AI can be bound to any domain or subdomain (e.g., <code className="docs-code">clips.yourdomain.com</code>).
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

          <div className="table-container" style={{ marginTop: '0.75rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name / Host</th>
                  <th>Target / Value</th>
                  <th>TTL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code className="docs-code">CNAME</code></td>
                  <td>{customDomain ? customDomain.split('.')[0] : 'clips'}</td>
                  <td><code className="docs-code">cname.vercel-dns.com</code> or VPS IP</td>
                  <td>Auto</td>
                </tr>
                <tr>
                  <td><code className="docs-code">A</code></td>
                  <td>@ (Root)</td>
                  <td><code className="docs-code">76.76.21.21</code></td>
                  <td>300</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', position: 'sticky', bottom: '1rem', backgroundColor: 'var(--bg-canvas)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} />
              <span>All API settings saved successfully!</span>
            </span>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving Credentials...' : 'Save API Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
