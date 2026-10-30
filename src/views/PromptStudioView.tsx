import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Play,
  Download,
  Upload,
  Check,
  Loader2,
  Volume2,
  Film,
  Music,
  Clock,
  Type,
  Utensils,
  Cpu,
  Brain,
  Rocket,
  DollarSign,
  Copy
} from 'lucide-react';
import { api } from '../api';
import type { ClipRecord } from '../api';

interface PromptStudioViewProps {
  onClipCreated: (clip: ClipRecord) => void;
  onPreviewClip: (clip: ClipRecord) => void;
  onOpenYouTubeUpload: (clip: ClipRecord) => void;
}

const INSPIRATION_PROMPTS = [
  {
    category: '🍔 Food & Cooking',
    icon: Utensils,
    prompt: 'The secret technique top chefs use to make steak ten times juicier',
    style: 'mouthwatering',
    aspect: '9:16'
  },
  {
    category: '🤖 AI & Future Tech',
    icon: Cpu,
    prompt: 'Why humanoid robots are quietly transforming warehouse manufacturing in 2026',
    style: 'neon',
    aspect: '9:16'
  },
  {
    category: '🧠 Mind & Psychology',
    icon: Brain,
    prompt: '5 subtle psychology tricks that instantly command respect in any conversation',
    style: 'cinematic',
    aspect: '9:16'
  },
  {
    category: '🌌 Space Mysteries',
    icon: Rocket,
    prompt: 'What actually happens to time and light when you approach a supermassive black hole',
    style: 'cinematic',
    aspect: '9:16'
  },
  {
    category: '💰 Wealth Principles',
    icon: DollarSign,
    prompt: 'The counter-intuitive leverage rule that separates the top 1% from wage earners',
    style: 'editorial',
    aspect: '9:16'
  }
];

export const PromptStudioView: React.FC<PromptStudioViewProps> = ({
  onClipCreated,
  onPreviewClip,
  onOpenYouTubeUpload
}) => {
  const [prompt, setPrompt] = useState('The secret technique top chefs use to make steak ten times juicier');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [style, setStyle] = useState<'cinematic' | 'kinetic' | 'editorial' | 'neon' | 'mouthwatering' | 'documentary'>('mouthwatering');
  const [durationSec, setDurationSec] = useState<number>(30);
  const [captionStyle, setCaptionStyle] = useState<'bold-yellow' | 'karaoke-blue' | 'minimal-white' | 'red-alert'>('bold-yellow');
  const [voiceName, setVoiceName] = useState<string>('en-US-ChristopherNeural');
  const [musicBed, setMusicBed] = useState<boolean>(true);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [generatedClip, setGeneratedClip] = useState<ClipRecord | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await api.enhancePrompt(prompt.trim());
      if (res.enhancedPrompt) {
        setPrompt(res.enhancedPrompt);
        if (res.suggestedStyle) setStyle(res.suggestedStyle as any);
        if (res.suggestedDuration) setDurationSec(res.suggestedDuration);
      }
    } catch (err: any) {
      console.warn('Enhance failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedClip(null);
    setActiveStep(1);

    // Dynamic progress stepper
    const t1 = setTimeout(() => setActiveStep(2), 2200);
    const t2 = setTimeout(() => setActiveStep(3), 5500);
    const t3 = setTimeout(() => setActiveStep(4), 11000);

    try {
      const clip = await api.generateFromPrompt({
        prompt: prompt.trim(),
        aspectRatio,
        durationSec,
        style,
        captionStyle,
        voiceName,
        musicBed
      });

      setActiveStep(5);
      setGeneratedClip(clip);
      onClipCreated(clip);
    } catch (err: any) {
      console.error('Prompt video generation failed:', err);
      setGenerationError(err.message || 'Failed to render AI video. Please try again.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsGenerating(false);
    }
  };

  const copyCaptionToClipboard = () => {
    if (!generatedClip) return;
    navigator.clipboard.writeText(`${generatedClip.title}\n\n${generatedClip.suggestedCaption}`);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Studio Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
          }}>
            <Wand2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>AI Video Creator</h2>
              <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.25)', color: '#c4b5fd', borderColor: '#7c3aed' }}>
                B-Roll + Remotion Kinetic Captions
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Synthesizing MoneyPrinter (real B-roll clips), ShortGPT (smart scene pacing), and Remotion (kinetic animated typography).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', borderColor: '#10b981' }}>
            Edge Neural Narration ($0)
          </span>
          <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', borderColor: '#3b82f6' }}>
            Real HD Video B-Roll
          </span>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Prompt Input Area */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              What video would you like to create?
            </label>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || isGenerating || !prompt.trim()}
              style={{ color: '#c4b5fd', borderColor: '#7c3aed' }}
              title="Use AI to turn this idea into a viral script blueprint"
            >
              {isEnhancing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance Hook with AI'}</span>
            </button>
          </div>

          <textarea
            className="form-input"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. The secret technique top chefs use to make steak ten times juicier... or 5 subtle psychology tricks that make people respect you instantly"
            style={{ fontSize: '1rem', resize: 'vertical', lineHeight: 1.5 }}
            disabled={isGenerating}
          />

          {/* Quick Creative Inspiration Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try an Idea:</span>
            {INSPIRATION_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setPrompt(item.prompt);
                  setStyle(item.style as any);
                  setAspectRatio(item.aspect as any);
                }}
                disabled={isGenerating}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>{item.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Studio Configuration Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          {/* 1. Visual Creative Style */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Film size={14} style={{ color: '#a78bfa' }} />
              <span>Visual Creative Style</span>
            </label>
            <select
              className="form-input"
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              disabled={isGenerating}
            >
              <option value="mouthwatering">🍔 Mouthwatering Culinary (Food & Recipe)</option>
              <option value="cinematic">🎬 Cinematic Realism (35mm Depth)</option>
              <option value="kinetic">⚡ Kinetic Viral High-Energy</option>
              <option value="neon">🔮 Cyberpunk Neon & Glow</option>
              <option value="editorial">📜 Documentary Special Report</option>
            </select>
          </div>

          {/* 2. Neural Voice Artist */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Volume2 size={14} style={{ color: '#38bdf8' }} />
              <span>Voiceover Narrator</span>
            </label>
            <select
              className="form-input"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              disabled={isGenerating}
            >
              <option value="en-US-ChristopherNeural">🎙️ Christopher (Energetic Creator)</option>
              <option value="en-US-JennyNeural">🎙️ Jenny (Warm & Natural Storyteller)</option>
              <option value="en-US-GuyNeural">🎙️ Guy (Casual & Confident Host)</option>
              <option value="en-US-AriaNeural">🎙️ Aria (Dynamic & Enthusiastic)</option>
              <option value="en-US-EricNeural">🎙️ Eric (Deep & Cinematic Narrator)</option>
            </select>
          </div>

          {/* 3. Subtitle Typography */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Type size={14} style={{ color: '#facc15' }} />
              <span>Burned Subtitles</span>
            </label>
            <select
              className="form-input"
              value={captionStyle}
              onChange={(e) => setCaptionStyle(e.target.value as any)}
              disabled={isGenerating}
            >
              <option value="bold-yellow">Bold Yellow (MrBeast / Viral)</option>
              <option value="karaoke-blue">Karaoke Cyan (Glowing High-Tech)</option>
              <option value="minimal-white">Minimalist Clean White</option>
              <option value="red-alert">Red Alert High-Energy</option>
            </select>
          </div>

          {/* 4. Format & Duration */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} style={{ color: '#34d399' }} />
              <span>Duration & Format</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-input"
                style={{ flex: 1 }}
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value))}
                disabled={isGenerating}
              >
                <option value={15}>15s (Rapid Hook)</option>
                <option value={30}>30s (Viral Short)</option>
                <option value={60}>60s (Deep Story)</option>
              </select>

              <select
                className="form-input"
                style={{ flex: 1 }}
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                disabled={isGenerating}
              >
                <option value="9:16">9:16 (Shorts/TikTok)</option>
                <option value="16:9">16:9 (Landscape)</option>
              </select>
            </div>
          </div>

          {/* 5. Background Audio Bed */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Music size={14} style={{ color: '#ec4899' }} />
              <span>Background Audio</span>
            </label>
            <select
              className="form-input"
              value={musicBed ? 'enabled' : 'disabled'}
              onChange={(e) => setMusicBed(e.target.value === 'enabled')}
              disabled={isGenerating}
            >
              <option value="enabled">🎵 Dynamic Ambient Bed (Ducked)</option>
              <option value="disabled">🎙️ Clean Voice Only</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateVideo}
            disabled={isGenerating || !prompt.trim()}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.05rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 18px rgba(124, 58, 237, 0.4)',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Directing & Rendering Multi-Scene Video...</span>
              </>
            ) : (
              <>
                <Wand2 size={20} />
                <span>Create Video Now (1-Click)</span>
              </>
            )}
          </button>
        </div>

        {/* Live Stepper / Progress Bar */}
        {isGenerating && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            padding: '1.25rem',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#93c5fd' }}>
                AI Video Production Pipeline:
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Step {activeStep} of 4
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { step: 1, title: 'Viral Hook & Script' },
                { step: 2, title: 'Neural Voiceover' },
                { step: 3, title: 'Real Video B-Roll' },
                { step: 4, title: 'Remotion Kinetic Captions' }
              ].map((s) => (
                <div
                  key={s.step}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: activeStep >= s.step ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${activeStep === s.step ? '#3b82f6' : activeStep > s.step ? '#10b981' : 'transparent'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: activeStep >= s.step ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  {activeStep > s.step ? (
                    <Check size={13} style={{ color: '#10b981' }} />
                  ) : activeStep === s.step ? (
                    <Loader2 size={13} className="animate-spin" style={{ color: '#60a5fa' }} />
                  ) : (
                    <span style={{ width: '13px', textAlign: 'center' }}>{s.step}</span>
                  )}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notice */}
        {generationError && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#fca5a5',
            fontSize: '0.875rem'
          }}>
            <strong>Generation Notice:</strong> {generationError}
          </div>
        )}
      </div>

      {/* Generated Result Showcase */}
      {generatedClip && (
        <div className="card" style={{
          border: '1px solid #10b981',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Your AI Video is Ready!</h3>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Duration: {generatedClip.duration}s • Format: {generatedClip.aspectRatio} • Virality Score: {generatedClip.viralityScore}/100
                </span>
              </div>
            </div>

            {/* Direct Upload to YouTube Trigger */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenYouTubeUpload(generatedClip)}
              style={{
                backgroundColor: '#ef4444',
                borderColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
            >
              <Upload size={16} />
              <span style={{ fontWeight: 700 }}>Upload to YouTube Shorts</span>
            </button>
          </div>

          {/* Details & Actions Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            {/* Left: Video Player */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#000000',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              maxHeight: '420px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)'
            }}>
              <video
                src={generatedClip.urlPath}
                controls
                autoPlay
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Right: Script Breakdown & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Video Title
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', color: '#ffffff', fontWeight: 600 }}>
                  {generatedClip.title}
                </h4>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Spoken Hook
                </span>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: '#fef08a', fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{generatedClip.hook}"
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  YouTube Description & Hashtags
                </span>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {generatedClip.suggestedCaption}
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onPreviewClip(generatedClip)}
                  style={{ gap: '0.4rem' }}
                >
                  <Play size={14} />
                  <span>Full Screen Preview</span>
                </button>

                <a
                  href={generatedClip.urlPath}
                  download
                  className="btn btn-outline btn-sm"
                  style={{ color: '#ffffff', gap: '0.4rem' }}
                >
                  <Download size={14} />
                  <span>Download MP4</span>
                </a>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={copyCaptionToClipboard}
                  style={{ gap: '0.4rem', color: copiedCaption ? '#6ee7b7' : 'inherit' }}
                >
                  <Copy size={14} />
                  <span>{copiedCaption ? 'Copied!' : 'Copy Caption'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
