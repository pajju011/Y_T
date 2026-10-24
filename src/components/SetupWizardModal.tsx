import React, { useState } from 'react';
import {
  Sparkles,
  HardDrive,
  Cloud,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Upload,
  Folder,
  ShieldCheck,
  Type
} from 'lucide-react';
import { api } from '../api';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: (skipped?: boolean) => void;
  onComplete: () => void;
  onUploadClick: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onUploadClick,
}) => {
  const [step, setStep] = useState<number>(1);
  const [channelName, setChannelName] = useState<string>('My Viral Shorts');
  const [niche, setNiche] = useState<string>('Tech & AI');
  
  // Storage & Google Drive
  const [storageProvider, setStorageProvider] = useState<'local' | 'google_drive' | 'both'>('both');
  const [folderName, setFolderName] = useState<string>('ClipGenius AI Vault');
  const [folderUrl, setFolderUrl] = useState<string>('');
  const [autoSync, setAutoSync] = useState<boolean>(true);

  // Caption & AI Preferences
  const [captionStyle, setCaptionStyle] = useState<'bold-yellow' | 'minimal-white' | 'karaoke-blue'>('bold-yellow');
  const [aiProvider, setAiProvider] = useState<'heuristic' | 'gemini'>('heuristic');
  const [geminiKey, setGeminiKey] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSkip = () => {
    try {
      localStorage.setItem('clipgenius_setup_status', 'skipped');
    } catch {}
    onClose(true);
  };

  const handleSaveAndFinish = async (nextAction?: 'studio' | 'upload') => {
    setIsSaving(true);
    try {
      // 1. Save Strategy
      await api.updateStrategy({
        channelName: channelName.trim() || 'My Viral Shorts',
        niche: niche || 'Tech & AI',
      });

      // 2. Save Google Drive & Storage configuration
      await api.updateGoogleDrive({
        storageProvider,
        folderName: folderName.trim() || 'ClipGenius AI Vault',
        folderUrl: folderUrl.trim(),
        autoSync,
        connected: storageProvider !== 'local' && (Boolean(folderUrl.trim()) || Boolean(folderName.trim())),
      });

      // 3. Save AI & Caption Settings
      await api.updateSettings({
        preferredLlmProvider: aiProvider as any,
        geminiApiKey: geminiKey.trim() ? geminiKey.trim() : undefined,
      });

      try {
        localStorage.setItem('clipgenius_setup_status', 'completed');
      } catch {}
      onComplete();

      if (nextAction === 'upload') {
        onUploadClick();
      }
    } catch (err) {
      console.error('Failed to complete setup:', err);
    } finally {
      setIsSaving(false);
      onClose(false);
    }
  };

  const niches = [
    'Tech & AI',
    'Finance & Business',
    'Productivity',
    'Creator Economy',
    'Gaming & Entertainment',
    'Health & Fitness'
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          width: '95%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Top Header with Steps & Skip */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                ClipGenius Quick Setup
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Step {step} of 4 &bull; 100% Free Local Video Clipper
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleSkip}
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-subtle)',
                padding: '0.35rem 0.65rem'
              }}
              title="Skip setup and jump straight into the studio. You can configure this later anytime."
            >
              Skip for Later
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleSkip}
              aria-label="Close setup modal"
              style={{ padding: '0.35rem' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', width: '100%', height: '3px', backgroundColor: 'var(--bg-canvas)' }}>
          <div
            style={{
              width: `${(step / 4) * 100}%`,
              backgroundColor: 'var(--accent-primary)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: Channel Profile */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                  Welcome! Tell us about your content
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  ClipGenius AI analyzes long videos or YouTube URLs to automatically cut high-engagement 9:16 vertical clips with dynamic captions.
                </p>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Channel or Project Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Daily Tech Highlights or Personal Brand"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Select Primary Content Niche
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {niches.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNiche(n)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${niche === n ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        backgroundColor: niche === n ? 'var(--accent-subtle)' : 'var(--bg-card)',
                        color: niche === n ? '#93c5fd' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{n}</span>
                      {niche === n && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}
              >
                <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Zero Subscription Required:</strong> ClipGenius runs completely locally on your machine with FFmpeg.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Storage & Google Drive */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                  Where should your videos be stored?
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Choose how you want to keep and back up your rendered 9:16 clips and source videos.
                </p>
              </div>

              {/* Storage Choice Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {/* Local Storage Card */}
                <div
                  onClick={() => setStorageProvider('local')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${storageProvider === 'local' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: storageProvider === 'local' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HardDrive size={18} style={{ color: storageProvider === 'local' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                      <strong style={{ fontSize: '0.92rem' }}>Local PC Only</strong>
                    </div>
                    {storageProvider === 'local' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Saved locally to your computer's <code style={{ color: '#93c5fd' }}>uploads/</code> folder. 100% private, instant disk access.
                  </p>
                </div>

                {/* Google Drive Card */}
                <div
                  onClick={() => setStorageProvider('both')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${storageProvider !== 'local' ? 'var(--success)' : 'var(--border-subtle)'}`,
                    backgroundColor: storageProvider !== 'local' ? 'var(--success-subtle)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cloud size={18} style={{ color: storageProvider !== 'local' ? 'var(--success)' : 'var(--text-muted)' }} />
                      <strong style={{ fontSize: '0.92rem' }}>Google Drive + Local</strong>
                    </div>
                    {storageProvider !== 'local' && <Check size={16} style={{ color: 'var(--success)' }} />}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Recommended: Auto-syncs your clips to your Google Drive folder so you can access them from phone or share with your team.
                  </p>
                </div>
              </div>

              {/* Google Drive Configuration Fields */}
              {storageProvider !== 'local' && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Folder size={16} style={{ color: 'var(--success)' }} />
                    <h4 style={{ fontSize: '0.92rem', margin: 0 }}>Google Drive Folder Configuration</h4>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Google Drive Folder Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="e.g. ClipGenius AI Vault"
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Google Drive Folder Link or URL (Optional)
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={folderUrl}
                      onChange={(e) => setFolderUrl(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/your-folder-id"
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Tip: Open Google Drive in your browser, create a folder for your clips, copy its share link, and paste it here.
                    </small>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      Automatically sync every newly rendered 9:16 clip to Google Drive
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Caption Style & AI Engine */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                  Style & AI Engine Preferences
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Choose your default burnt-in subtitle look and your highlight detection provider.
                </p>
              </div>

              {/* Caption Styles */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Type size={15} />
                  <span>Default Dynamic Subtitle Style</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginTop: '0.35rem' }}>
                  {[
                    { id: 'bold-yellow', label: 'Bold Yellow', desc: 'MrBeast high-retention style' },
                    { id: 'minimal-white', label: 'Minimal White', desc: 'Clean, elegant documentary' },
                    { id: 'karaoke-blue', label: 'Karaoke Blue', desc: 'Modern glowing tech accent' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setCaptionStyle(style.id as any)}
                      style={{
                        padding: '0.85rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${captionStyle === style.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        backgroundColor: captionStyle === style.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <strong style={{ fontSize: '0.85rem', color: captionStyle === style.id ? '#93c5fd' : 'var(--text-primary)' }}>
                        {style.label}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Engine Choice */}
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  AI Highlight Engine
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.35rem' }}>
                  <div
                    onClick={() => setAiProvider('heuristic')}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${aiProvider === 'heuristic' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      backgroundColor: aiProvider === 'heuristic' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>100% Free Built-in Pattern Engine (Default)</strong>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Zero API keys required. Detects hooks and energetic segments using local algorithms.
                      </p>
                    </div>
                    {aiProvider === 'heuristic' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                  </div>

                  <div
                    onClick={() => setAiProvider('gemini')}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${aiProvider === 'gemini' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      backgroundColor: aiProvider === 'gemini' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>Google Gemini 2.0 Flash (Free API Key)</strong>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Deep viral reasoning, semantic hook ranking, and tailored punchy captions.
                      </p>
                    </div>
                    {aiProvider === 'gemini' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                  </div>

                  {aiProvider === 'gemini' && (
                    <input
                      type="password"
                      className="form-input"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="Paste your Gemini API key (or leave blank to use free built-in engine)"
                      style={{ fontSize: '0.82rem' }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Ready to Create! */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-subtle)',
                    border: '1px solid var(--success-border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)',
                    marginBottom: '0.75rem'
                  }}
                >
                  <Check size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                  You're all set to create viral shorts!
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Here is a quick summary of your configured production workspace:
                </p>
              </div>

              {/* Summary Box */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Channel Name:</span>
                  <strong>{channelName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Content Niche:</span>
                  <strong>{niche}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Storage Strategy:</span>
                  <strong>
                    {storageProvider !== 'local' ? `Google Drive (${folderName}) + Local` : 'Local Disk'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtitle Style:</span>
                  <strong style={{ textTransform: 'capitalize' }}>{captionStyle.replace('-', ' ')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Local Engine Cost:</span>
                  <strong style={{ color: 'var(--success)' }}>$0.00 / 100% Free</strong>
                </div>
              </div>

              {/* Quick Launch Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  HOW WOULD YOU LIKE TO START?
                </span>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSaveAndFinish('upload')}
                  disabled={isSaving}
                  style={{ justifyContent: 'center', padding: '0.75rem' }}
                >
                  <Upload size={16} />
                  <span>Upload Your First Video (MP4, MOV, WebM)</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSaveAndFinish('studio')}
                  disabled={isSaving}
                  style={{ justifyContent: 'center' }}
                >
                  <Sparkles size={14} />
                  <span>Go to AI Studio & YouTube Ingest</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleSkip}
              style={{ color: 'var(--text-secondary)' }}
            >
              Skip for Later
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {step < 4 ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setStep(step + 1)}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => handleSaveAndFinish('studio')}
                disabled={isSaving}
              >
                <Check size={14} />
                <span>{isSaving ? 'Saving...' : 'Finish Setup'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
