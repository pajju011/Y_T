import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Download,
  Eye,
  Trash2,
  Edit2,
  Film,
  Send,
  Clock,
  X
} from 'lucide-react';
import type { ClipRecord } from '../api';

interface ApprovalsViewProps {
  clips: ClipRecord[];
  onPreviewClip: (clip: ClipRecord) => void;
  onUpdateClip: (id: string, updates: Partial<ClipRecord>) => Promise<void>;
  onDeleteClip: (id: string) => Promise<void>;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  clips,
  onPreviewClip,
  onUpdateClip,
  onDeleteClip,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCaption, setEditCaption] = useState<string>('');
  const [scheduleModalClip, setScheduleModalClip] = useState<ClipRecord | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('12:00');

  const filteredClips = filterStatus === 'all'
    ? clips
    : clips.filter(c => c.status === filterStatus);

  const startEditing = (clip: ClipRecord) => {
    setEditingClipId(clip.id);
    setEditTitle(clip.title);
    setEditCaption(clip.suggestedCaption);
  };

  const saveEditing = async (id: string) => {
    await onUpdateClip(id, {
      title: editTitle,
      suggestedCaption: editCaption,
    });
    setEditingClipId(null);
  };

  const handleOpenSchedule = (clip: ClipRecord) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setScheduleDate(dateStr);
    setScheduleModalClip(clip);
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleModalClip || !scheduleDate) return;
    await onUpdateClip(scheduleModalClip.id, {
      status: 'scheduled',
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
    });
    setScheduleModalClip(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Review & Approval Pipeline</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Approve captions, fine-tune titles, and push finalized clips to the publishing schedule.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'in_review', 'approved', 'scheduled', 'published'].map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All Clips' : status.replace('_', ' ')}
              <span style={{ opacity: 0.7, marginLeft: '0.3rem' }}>
                ({status === 'all' ? clips.length : clips.filter(c => c.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clip Cards Grid */}
      {filteredClips.length === 0 ? (
        <div className="empty-state">
          <Film className="empty-icon" />
          <h3 className="empty-title">No clips in this stage</h3>
          <p className="empty-desc">
            Use the Studio & Clipper to ingest videos and generate candidate clips.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredClips.map((clip) => {
            const isEditing = editingClipId === clip.id;

            return (
              <div key={clip.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`badge badge-${clip.status}`}>
                    {clip.status.replace('_', ' ')}
                  </span>
                  <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#93c5fd', borderColor: 'var(--accent-border)' }}>
                    Virality: {clip.viralityScore}/100
                  </span>
                </div>

                {/* Title & Duration */}
                {isEditing ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Clip Title</label>
                    <input
                      className="form-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{clip.title}</h3>
                    <small style={{ color: 'var(--text-muted)' }}>
                      Duration: {Math.round(clip.duration)}s &bull; Format: {clip.aspectRatio} &bull; Source: {clip.videoTitle}
                    </small>
                  </div>
                )}

                {/* Hook & Caption */}
                {isEditing ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Caption & Hashtags</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                    />
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>HOOK LINE:</div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{clip.hook}"
                    </p>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.2rem' }}>CAPTION:</div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {clip.suggestedCaption}
                    </p>
                  </div>
                )}

                {/* Scheduled Info if any */}
                {clip.scheduledDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#93c5fd', backgroundColor: 'rgba(37, 99, 235, 0.08)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-xs)' }}>
                    <Clock size={13} />
                    <span>Scheduled for {clip.scheduledDate} at {clip.scheduledTime || '12:00'}</span>
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {isEditing ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => saveEditing(clip.id)}>
                        <Check size={13} />
                        <span>Save Changes</span>
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingClipId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => onPreviewClip(clip)}>
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>

                      <button className="btn btn-outline btn-sm" onClick={() => startEditing(clip)}>
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <a
                        href={clip.urlPath}
                        download={`${clip.title}.mp4`}
                        className="btn btn-outline btn-sm"
                        title="Download MP4"
                      >
                        <Download size={13} />
                      </a>

                      {clip.status === 'in_review' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => onUpdateClip(clip.id, { status: 'approved' })}
                        >
                          <Check size={13} />
                          <span>Approve</span>
                        </button>
                      )}

                      {clip.status !== 'scheduled' && clip.status !== 'published' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenSchedule(clip)}
                        >
                          <Calendar size={13} />
                          <span>Schedule</span>
                        </button>
                      )}

                      {clip.status === 'scheduled' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => onUpdateClip(clip.id, { status: 'published' })}
                        >
                          <Send size={13} />
                          <span>Mark Published</span>
                        </button>
                      )}

                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: '#fca5a5', marginLeft: 'auto' }}
                        onClick={() => onDeleteClip(clip.id)}
                        title="Delete clip"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalClip && (
        <div className="modal-backdrop" onClick={() => setScheduleModalClip(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem' }}>Schedule Publishing</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setScheduleModalClip(null)}>
                <X size={15} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Assign a publishing date and time for <strong>"{scheduleModalClip.title}"</strong>. This will appear on your Publishing Calendar.
            </p>

            <div className="form-group">
              <label className="form-label">Publishing Date</label>
              <input
                type="date"
                className="form-input"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Publishing Time</label>
              <input
                type="time"
                className="form-input"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setScheduleModalClip(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmSchedule}>
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
