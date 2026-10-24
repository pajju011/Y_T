import React from 'react';
import { Upload, HardDrive, Sparkles, Cloud } from 'lucide-react';
import type { SystemInfo } from '../api';

const YoutubeIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 14, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface HeaderProps {
  title: string;
  description: string;
  systemInfo: SystemInfo | null;
  googleDriveConnected?: boolean;
  onUploadClick: () => void;
  onYouTubeClick: () => void;
  onOpenSetupWizard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  systemInfo,
  googleDriveConnected,
  onUploadClick,
  onYouTubeClick,
  onOpenSetupWizard,
}) => {
  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div>
          <h1 className="topbar-title">{title}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{description}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
          <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#93c5fd', borderColor: 'var(--accent-border)' }}>
            <HardDrive size={12} />
            <span>Local Instance</span>
          </span>

          {googleDriveConnected && (
            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', borderColor: 'var(--success-border)' }}>
              <Cloud size={12} />
              <span>Google Drive</span>
            </span>
          )}

          <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', borderColor: 'var(--success-border)' }}>
            <span>{systemInfo?.activeAiProvider ? '100% Free AI' : '$0 Cost Model'}</span>
          </span>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={onOpenSetupWizard}
          title="Open Setup Wizard to configure Google Drive storage, AI keys, and preferences"
          style={{ gap: '0.4rem', borderColor: 'var(--accent-border)', color: '#93c5fd' }}
        >
          <Sparkles size={14} />
          <span>Quick Setup</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onYouTubeClick}
          title="Import any public YouTube video via yt-dlp"
          style={{ gap: '0.4rem' }}
        >
          <YoutubeIcon size={14} style={{ color: '#f87171' }} />
          <span>Import YouTube</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={onUploadClick}
          title="Upload MP4, MOV, or WebM video file"
        >
          <Upload size={15} />
          <span>Upload Video</span>
        </button>
      </div>
    </header>
  );
};
