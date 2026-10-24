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
  Cpu
} from 'lucide-react';
import type { MetricsData, SystemInfo } from '../api';

export type ActiveTab = 'dashboard' | 'studio' | 'approvals' | 'calendar' | 'trends' | 'integrations' | 'settings' | 'legal';

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
        <div className="brand-icon-box" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <div>
          <div className="brand-title">ClipGenius AI</div>
        </div>
        <span className="brand-badge">SaaS</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Core Workspace</span>
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'studio' ? 'active' : ''}`}
          onClick={() => setActiveTab('studio')}
        >
          <Video size={18} />
          <span>Studio & Ingest</span>
          {metrics && metrics.totalVideos > 0 && (
            <span className="nav-item-count">{metrics.totalVideos}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <CheckSquare size={18} />
          <span>Review & Approvals</span>
          {metrics && metrics.inReviewClips > 0 && (
            <span className="nav-item-count">{metrics.inReviewClips}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={18} />
          <span>Publishing Calendar</span>
          {metrics && metrics.scheduledClips > 0 && (
            <span className="nav-item-count">{metrics.scheduledClips}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp size={18} />
          <span>Trend Radar</span>
        </button>

        <span className="nav-section-label" style={{ marginTop: '0.75rem' }}>Configuration & Trust</span>
        <button
          className={`nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          <Share2 size={18} />
          <span>Integrations</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Settings & Free Setup</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'legal' ? 'active' : ''}`}
          onClick={() => setActiveTab('legal')}
        >
          <ShieldCheck size={18} />
          <span>Credibility & Policies</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot" style={{ backgroundColor: systemInfo?.ffmpeg.available ? 'var(--success)' : 'var(--warning)' }}></span>
          <span>FFmpeg 8.1: {systemInfo?.ffmpeg.available ? 'Ready (Local)' : 'Initializing'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <HardDrive size={13} />
          <span>Local Storage: {metrics?.storageFormatted || '0.0 MB'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          <Cpu size={13} />
          <span>Cost: $0.00 (100% Free)</span>
        </div>
      </div>
    </aside>
  );
};
