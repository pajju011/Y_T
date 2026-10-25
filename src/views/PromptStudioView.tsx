import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Play,
  Download,
  Upload,
  Check,
  Loader2
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
    category: '🧠 Psychology & Mind',
    prompt: '5 subtle psychology tricks that make people instantly respect you',
    style: 'cinematic',
    aspect: '9:16'
  },
  {
    category: '🤖 AI & Future Tech',
    prompt: 'Why humanoid robots are quietly replacing warehouse workers in 2026',
    style: 'neon',
    aspect: '9:16'
  },
  {
    category: '⚡ Productivity',
    prompt: 'The 2-minute morning rule used by top CEOs to eliminate brain fog',
    style: 'editorial',
    aspect: '9:16'
  },
  {
    category: '💰 Business Secrets',
    prompt: 'The shocking reason why Costco will never raise the $1.50 hotdog price',
    style: 'kinetic',
    aspect: '9:16'
  },
  {
    category: '🌌 Science & Space',
    prompt: 'What happens to time as you approach the event horizon of a black hole',
    style: 'cinematic',
    aspect: '16:9'
  }
];

export const PromptStudioView: React.FC<PromptStudioViewProps> = ({
  onClipCreated,
  onPreviewClip,
  onOpenYouTubeUpload
}) => {
  const [prompt, setPrompt] = useState('5 subtle psychology tricks that make people instantly respect you');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [style, setStyle] = useState<'cinematic' | 'kinetic' | 'editorial' | 'neon'>('cinematic');
  const [durationSec, setDurationSec] = useState<number>(30);
  const [captionStyle, setCaptionStyle] = useState<'bold-yellow' | 'karaoke-blue' | 'minimal-white' | 'red-alert'>('bold-yellow');
  const [voiceLanguage, setVoiceLanguage] = useState<string>('English');
  const [musicBed] = useState<boolean>(true);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [generatedClip, setGeneratedClip] = useState<ClipRecord | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

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

    // Simulated progress steps for smooth UX feedback
    const t1 = setTimeout(() => setActiveStep(2), 2200);
    const t2 = setTimeout(() => setActiveStep(3), 5000);
    const t3 = setTimeout(() => setActiveStep(4), 9500);

    try {
      const clip = await api.generateFromPrompt({
        prompt: prompt.trim(),
        aspectRatio,
        durationSec,
        style,
        captionStyle,
        voiceLanguage,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
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
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
          }}>
            <Wand2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>AI Prompt-to-Video Studio</h2>
              <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#c4b5fd', borderColor: '#7c3aed' }}>
                Full Generation
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Turn any topic or idea into a finished video with neural voiceover, b-roll footage, and dynamic subtitles.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
            Spoken Neural Voice: $0.00 Free
          </span>
          <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderColor: '#ef4444' }}>
            Direct YouTube Upload
          </span>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Prompt Input Area */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              Enter Video Topic or Story Prompt
            </label>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || isGenerating || !prompt.trim()}
              style={{ color: '#c4b5fd', borderColor: '#7c3aed' }}
              title="Use AI to turn this idea into a high-retention video script blueprint"
            >
              {isEnhancing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
            </button>
          </div>

          <textarea
            className="form-input"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 5 psychological tricks that instantly make people trust you... or Explain how quantum computers work in 30 seconds"
            style={{ fontSize: '0.95rem', resize: 'vertical' }}
            disabled={isGenerating}
          />

          {/* Quick Starter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Prompts:</span>
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
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '14px' }}
              >
                <span>{item.category}:</span>
                <span style={{ color: 'var(--text-secondary)' }}>"{item.prompt.slice(0, 32)}..."</span>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          {/* 1. Aspect Ratio */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Format & Platform</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${aspectRatio === '9:16' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setAspectRatio('9:16')}
                disabled={isGenerating}
              >
                <span>9:16 (Shorts/Reels)</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${aspectRatio === '16:9' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setAspectRatio('16:9')}
                disabled={isGenerating}
              >
                <span>16:9 (YouTube Video)</span>
              </button>
            </div>
          </div>

          {/* 2. Visual Motion Style */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Visual Style</label>
            <select
              className="form-input"
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              disabled={isGenerating}
            >
              <option value="cinematic">Cinematic B-Roll & Depth</option>
              <option value="neon">Cyberpunk Neon & Glow</option>
              <option value="editorial">Editorial Special Report</option>
              <option value="kinetic">Kinetic High-Contrast Motion</option>
            </select>
          </div>

          {/* 3. Duration */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Target Duration</label>
            <select
              className="form-input"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              disabled={isGenerating}
            >
              <option value={15}>15 Seconds (Rapid Hook)</option>
              <option value={30}>30 Seconds (Optimal Retention)</option>
              <option value={60}>60 Seconds (Deep-Dive Narrative)</option>
            </select>
          </div>

          {/* 4. Subtitle Style */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Burned Subtitle Style</label>
            <select
              className="form-input"
              value={captionStyle}
              onChange={(e) => setCaptionStyle(e.target.value as any)}
              disabled={isGenerating}
            >
              <option value="bold-yellow">Bold Yellow (MrBeast / Hormozi)</option>
              <option value="karaoke-blue">Karaoke Sky Blue (Glowing Modern)</option>
              <option value="minimal-white">Minimalist White Documentary</option>
              <option value="red-alert">Red Alert High-Energy</option>
            </select>
          </div>

          {/* 5. Voice Language */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Spoken Narration</label>
            <select
              className="form-input"
              value={voiceLanguage}
              onChange={(e) => setVoiceLanguage(e.target.value)}
              disabled={isGenerating}
            >
              <option value="English">English (US / Neutral)</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Portuguese">Portuguese (Português)</option>
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
              padding: '0.9rem',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              border: 'none',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Crafting AI Video from Prompt...</span>
              </>
            ) : (
              <>
                <Wand2 size={18} />
                <span>Generate Video from Prompt (1-Click)</span>
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
                AI Video Production Pipeline in Progress:
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Step {activeStep} of 4
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { step: 1, title: 'Viral Script & Hook' },
                { step: 2, title: 'Neural Spoken Voice' },
                { step: 3, title: 'B-Roll & Motion Canvas' },
                { step: 4, title: 'Burn Captions & Compile' }
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
            <strong>Generation Error:</strong> {generationError}
          </div>
        )}
      </div>

      {/* Generated Result Showcase */}
      {generatedClip && (
        <div className="card" style={{
          border: '1px solid #10b981',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0.6) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI Video Rendered Successfully!</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
                padding: '0.55rem 1.15rem',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Upload size={16} />
              <span style={{ fontWeight: 700 }}>Upload Directly to YouTube</span>
            </button>
          </div>

          {/* Details & Actions Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
            alignItems: 'center'
          }}>
            {/* Left: Video Preview Mini Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#000000',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              maxHeight: '360px',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              <video
                src={generatedClip.urlPath}
                controls
                style={{
                  width: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Right: Script Breakdown & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Video Title
                </span>
                <h4 style={{ margin: '0.15rem 0 0', fontSize: '1rem', color: '#ffffff' }}>
                  {generatedClip.title}
                </h4>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Spoken 3-Second Hook
                </span>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: '#fef08a', fontStyle: 'italic' }}>
                  "{generatedClip.hook}"
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  YouTube Caption & Hashtags
                </span>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {generatedClip.suggestedCaption}
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onPreviewClip(generatedClip)}
                >
                  <Play size={13} />
                  <span>Full Screen Preview</span>
                </button>

                <a
                  href={generatedClip.urlPath}
                  download
                  className="btn btn-outline btn-sm"
                  style={{ color: '#ffffff' }}
                >
                  <Download size={13} />
                  <span>Download MP4</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
