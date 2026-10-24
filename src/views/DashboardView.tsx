import React from 'react';
import {
  Video,
  Film,
  CheckCircle2,
  Calendar,
  Upload,
  Play,
  Download,
  Eye,
  TrendingUp,
  Sparkles,
  Cloud
} from 'lucide-react';
import type { MetricsData, ClipRecord, VideoRecord } from '../api';
import type { ActiveTab } from '../components/Sidebar';

interface DashboardViewProps {
  metrics: MetricsData | null;
  clips: ClipRecord[];
  videos: VideoRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  onPreviewClip: (clip: ClipRecord) => void;
  onDemoClick: () => void;
  onUploadClick: () => void;
  onOpenSetupWizard?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  clips,
  videos,
  setActiveTab,
  onPreviewClip,
  onDemoClick,
  onUploadClick,
  onOpenSetupWizard,
}) => {
  const recentClips = clips.slice(0, 6);
  const syncedClipsCount = clips.filter(c => c.googleDriveSynced).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 3-Step Effortless Workflow Guide */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-strong)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={17} style={{ color: '#93c5fd' }} />
              <span>How ClipGenius Works — In 3 Simple Steps</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Zero complicated editing. Turn any long recording or YouTube video into viral 9:16 vertical shorts.
            </p>
          </div>

          {onOpenSetupWizard && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onOpenSetupWizard}
              style={{ borderColor: 'var(--accent-border)', color: '#93c5fd', fontSize: '0.8rem' }}
            >
              <Sparkles size={13} />
              <span>Quick Setup Wizard</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {/* Step 1 */}
          <div
            onClick={() => setActiveTab('studio')}
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              <strong style={{ fontSize: '0.9rem' }}>Add Video</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Upload an MP4 or paste any YouTube URL in AI Studio (or try our 1-click Sample).
            </p>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => setActiveTab('studio')}
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              <strong style={{ fontSize: '0.9rem' }}>1-Click AI Detect</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Click "Detect Viral Highlights" to auto-find the top hook segments and punchy quotes.
            </p>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => setActiveTab('approvals')}
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--success)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
              <strong style={{ fontSize: '0.9rem' }}>Save & Google Drive</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Render 9:16 with burned subtitles, sync directly to Google Drive or download MP4.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row: REAL metrics only */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Workspace Activity & Storage
        </h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-card-header">
              <span>Source Videos</span>
              <Video size={18} />
            </div>
            <div className="metric-value">{metrics ? metrics.totalVideos : videos.length}</div>
            <div className="metric-label">Ingested into local library</div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>Generated Shorts</span>
              <Film size={18} />
            </div>
            <div className="metric-value">{metrics ? metrics.totalClips : 0}</div>
            <div className="metric-label">Rendered with local FFmpeg</div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>Approved & Scheduled</span>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            </div>
            <div className="metric-value">{metrics ? metrics.approvedClips : 0}</div>
            <div className="metric-label">
              {metrics ? metrics.scheduledClips : 0} queued on calendar
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>Google Drive & Storage</span>
              <Cloud size={18} style={{ color: syncedClipsCount > 0 ? 'var(--success)' : 'var(--text-muted)' }} />
            </div>
            <div className="metric-value">
              {syncedClipsCount > 0 ? `${syncedClipsCount} Synced` : (metrics ? metrics.storageFormatted : '0.0 MB')}
            </div>
            <div className="metric-label">
              {syncedClipsCount > 0 ? 'Stored in Google Drive Vault' : 'Local uploads/ • Drive ready'}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Direct Production Controls</h3>
          <p style={{ fontSize: '0.875rem' }}>
            Turn long-form recordings into vertical 9:16 short clips, edit captions, and schedule posts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('trends')}>
            <TrendingUp size={15} />
            <span>View Trend Radar</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('calendar')}>
            <Calendar size={15} />
            <span>Publishing Calendar</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('studio')}>
            <Sparkles size={15} />
            <span>Open Studio</span>
          </button>
        </div>
      </div>

      {/* Recent Clips Table */}
      <section aria-labelledby="recent-clips-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 id="recent-clips-heading" style={{ fontSize: '1.15rem' }}>Recent Clips</h2>
          <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('approvals')}>
            View All ({clips.length})
          </button>
        </div>

        {clips.length === 0 ? (
          <div className="empty-state">
            <Film className="empty-icon" />
            <h3 className="empty-title">No clips created yet</h3>
            <p className="empty-desc">
              Upload a video or generate a quick test sample to start cutting high-retention short clips.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={onDemoClick}>
                <Play size={14} />
                <span>Create Sample Video</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={onUploadClick}>
                <Upload size={14} />
                <span>Upload Video</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Clip Title</th>
                  <th>Source</th>
                  <th>Duration</th>
                  <th>Virality Score</th>
                  <th>Status</th>
                  <th>Platforms</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentClips.map((clip) => (
                  <tr key={clip.id}>
                    <td style={{ fontWeight: 500, maxWidth: '280px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {clip.title}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{clip.videoTitle}</td>
                    <td>{Math.round(clip.duration)}s</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#93c5fd', borderColor: 'var(--accent-border)' }}>
                        {clip.viralityScore}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${clip.status}`}>
                        {clip.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {clip.platforms.join(', ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onPreviewClip(clip)}
                          title="Preview Clip in 9:16 vertical player"
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>
                        <a
                          href={clip.urlPath}
                          download={`${clip.title}.mp4`}
                          className="btn btn-outline btn-sm"
                          title="Download MP4 file"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
