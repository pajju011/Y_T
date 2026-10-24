import React, { useState } from 'react';
import { X, Download, Check, Calendar, Type } from 'lucide-react';
import type { ClipRecord } from '../api';

interface VideoPlayerModalProps {
  clip: ClipRecord;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: ClipRecord['status']) => void;
  onUpdateCaptionStyle?: (id: string, style: ClipRecord['captionStyle']) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  clip,
  onClose,
  onUpdateStatus,
  onUpdateCaptionStyle,
}) => {
  const [captionStyle, setCaptionStyle] = useState<ClipRecord['captionStyle']>(clip.captionStyle || 'bold-yellow');

  const handleStyleChange = (style: ClipRecord['captionStyle']) => {
    setCaptionStyle(style);
    if (onUpdateCaptionStyle) {
      onUpdateCaptionStyle(clip.id, style);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>{clip.title}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Source: {clip.videoTitle} &bull; Duration: {Math.round(clip.duration)}s &bull; Aspect: {clip.aspectRatio}
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Vertical 9:16 Player Frame */}
          <div className="vertical-player-wrapper">
            <video
              className="vertical-player-video"
              src={clip.urlPath}
              controls
              playsInline
              autoPlay
            />

            {/* Simulated Live Dynamic Caption Overlay */}
            {captionStyle !== 'none' && (
              <div className={`caption-overlay caption-${captionStyle}`}>
                {clip.hook}
              </div>
            )}
          </div>

          {/* Controls & Metadata Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>VIRALITY ANALYSIS</span>
                <span className="badge badge-approved" style={{ fontWeight: 700 }}>
                  Score: {clip.viralityScore}/100
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{clip.viralityReason}</p>
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Type size={14} />
                <span>On-Screen Caption Styling</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'bold-yellow' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStyleChange('bold-yellow')}
                >
                  Bold Yellow
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'minimal-white' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStyleChange('minimal-white')}
                >
                  Minimal White
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'karaoke-blue' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStyleChange('karaoke-blue')}
                >
                  Karaoke Blue
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStyleChange('none')}
                >
                  None
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">First 3-Second Spoken Hook</label>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', padding: '0.6rem', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                "{clip.hook}"
              </p>
            </div>

            <div>
              <label className="form-label">Suggested Caption & Hashtags</label>
              <textarea
                className="form-textarea"
                rows={3}
                defaultValue={clip.suggestedCaption}
                readOnly
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
              <a
                href={clip.urlPath}
                download={`${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`}
                className="btn btn-outline btn-sm"
                style={{ flex: 1 }}
              >
                <Download size={14} />
                <span>Download MP4</span>
              </a>

              {clip.status !== 'approved' && onUpdateStatus && (
                <button
                  className="btn btn-success btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onUpdateStatus(clip.id, 'approved')}
                >
                  <Check size={14} />
                  <span>Approve Clip</span>
                </button>
              )}

              {clip.status !== 'scheduled' && onUpdateStatus && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onUpdateStatus(clip.id, 'scheduled')}
                >
                  <Calendar size={14} />
                  <span>Send to Schedule</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
