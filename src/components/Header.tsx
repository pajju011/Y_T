import React from 'react';
import { Upload, PlayCircle, HardDrive, Sparkles, Cloud } from 'lucide-react';
import type { SystemInfo } from '../api';

interface HeaderProps {
  title: string;
  description: string;
  systemInfo: SystemInfo | null;
  googleDriveConnected?: boolean;
  onUploadClick: () => void;
  onDemoClick: () => void;
  onOpenSetupWizard: () => void;
  isGeneratingDemo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  systemInfo,
  googleDriveConnected,
  onUploadClick,
  onDemoClick,
  onOpenSetupWizard,
  isGeneratingDemo,
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
          onClick={onDemoClick}
          disabled={isGeneratingDemo}
          title="Generates a 45s test video using local FFmpeg in ~2 seconds"
        >
          <PlayCircle size={15} />
          <span>{isGeneratingDemo ? 'Generating Demo...' : 'Create Sample Video'}</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={onUploadClick}
        >
          <Upload size={15} />
          <span>Upload Video</span>
        </button>
      </div>
    </header>
  );
};
