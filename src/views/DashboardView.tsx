import React from 'react';
import {
  Video,
  Film,
  CheckCircle2,
  Calendar,
  HardDrive,
  Upload,
  Play,
  Download,
  Eye,
  TrendingUp,
  Sparkles
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  clips,
  videos,
  setActiveTab,
  onPreviewClip,
  onDemoClick,
  onUploadClick,
}) => {
  const recentClips = clips.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Metrics Row: REAL metrics only */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Workspace Activity Metrics
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
              <span>Local Disk Usage</span>
              <HardDrive size={18} />
            </div>
            <div className="metric-value">{metrics ? metrics.storageFormatted : '0.0 MB'}</div>
            <div className="metric-label">Zero external hosting charges</div>
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
