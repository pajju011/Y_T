import React from 'react';
import {
  LayoutDashboard,
  Video,
  CheckSquare,
  Calendar,
  TrendingUp,
  Share2,
  Settings,
  ShieldCheck,
  HardDrive,
  Sparkles,
  Wand2,
  Flame
} from 'lucide-react';
import type { MetricsData, SystemInfo } from '../api';

export type ActiveTab = 'dashboard' | 'studio' | 'prompt-video' | 'strategy' | 'trends' | 'approvals' | 'calendar' | 'integrations' | 'settings' | 'legal';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  metrics: MetricsData | null;
  systemInfo: SystemInfo | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  systemInfo,
}) => {
  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      <div className="sidebar-header">
        <div className="brand-icon-box" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <div>
          <div className="brand-title">ClipGenius AI</div>
        </div>
        <span className="brand-badge" style={{ background: 'rgba(124, 58, 237, 0.25)', color: '#c4b5fd', borderColor: '#7c3aed' }}>
          PRO
        </span>
      </div>

      <nav className="sidebar-nav">
        {/* Core Studio Creators */}
        <span className="nav-section-label">Creator Studio</span>
        <button
          className={`nav-item ${activeTab === 'prompt-video' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompt-video')}
        >
          <Wand2 size={17} style={{ color: '#a78bfa' }} />
          <span>AI Video Creator</span>
          <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.25)', color: '#c4b5fd', fontSize: '0.65rem', padding: '0.1rem 0.35rem', marginLeft: 'auto' }}>
            Multi-Scene
          </span>
        </button>

        <button
          className={`nav-item ${activeTab === 'studio' ? 'active' : ''}`}
          onClick={() => setActiveTab('studio')}
        >
          <Video size={17} />
          <span>Long Video Clipper</span>
          {metrics && metrics.totalVideos > 0 && (
            <span className="nav-item-count">{metrics.totalVideos}</span>
          )}
        </button>

        {/* Content & Intelligence */}
        <span className="nav-section-label" style={{ marginTop: '0.75rem' }}>Content & Discovery</span>
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={17} />
          <span>Studio Hub</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp size={17} />
          <span>Live Trends Radar</span>
          {metrics && metrics.liveTrendsCount && metrics.liveTrendsCount > 0 ? (
            <span className="nav-item-count">{metrics.liveTrendsCount}</span>
          ) : null}
        </button>

        <button
          className={`nav-item ${activeTab === 'strategy' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategy')}
        >
          <Sparkles size={17} />
          <span>Content Strategy</span>
        </button>

        {/* Publishing & Workflow */}
        <span className="nav-section-label" style={{ marginTop: '0.75rem' }}>Publishing & Queue</span>
        <button
          className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <CheckSquare size={17} />
          <span>Review & Approvals</span>
          {metrics && metrics.inReviewClips > 0 && (
            <span className="nav-item-count">{metrics.inReviewClips}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={17} />
          <span>Schedule & Calendar</span>
          {metrics && metrics.scheduledClips > 0 && (
            <span className="nav-item-count">{metrics.scheduledClips}</span>
          )}
        </button>

        {/* Settings & Channels */}
        <span className="nav-section-label" style={{ marginTop: '0.75rem' }}>Channels & Setup</span>
        <button
          className={`nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          <Share2 size={17} />
          <span>Channel Connections</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={17} />
          <span>Studio Settings</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'legal' ? 'active' : ''}`}
          onClick={() => setActiveTab('legal')}
        >
          <ShieldCheck size={17} />
          <span>Policies & Compliance</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot" style={{ backgroundColor: systemInfo?.ffmpeg.available ? 'var(--success)' : 'var(--warning)' }}></span>
          <span>Engine: {systemInfo?.ffmpeg.available ? 'FFmpeg 8.1 Ready' : 'Initializing'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Flame size={13} style={{ color: '#f59e0b' }} />
          <span>Neural Voice: Edge HD ($0)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          <HardDrive size={13} />
          <span>Storage: {metrics?.storageFormatted || '0.0 MB'}</span>
        </div>
      </div>
    </aside>
  );
};
