import React, { useState } from 'react';
import {
  Upload,
  Play,
  Scissors,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Trash2,
  Loader2
} from 'lucide-react';
import type { VideoRecord, HighlightCandidate, ClipRecord } from '../api';
import { api } from '../api';

interface StudioViewProps {
  videos: VideoRecord[];
  onUploadVideo: (file: File) => Promise<void>;
  onDemoClick: () => void;
  isGeneratingDemo: boolean;
  onClipCreated: (clip: ClipRecord) => void;
  onPreviewClip: (clip: ClipRecord) => void;
  onDeleteVideo: (id: string) => Promise<void>;
}

export const StudioView: React.FC<StudioViewProps> = ({
  videos,
  onUploadVideo,
  onDemoClick,
  isGeneratingDemo,
  onClipCreated,
  onDeleteVideo,
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>(videos[0]?.id || '');
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<HighlightCandidate[]>([]);
  const [renderingIndex, setRenderingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedVideo = videos.find(v => v.id === selectedVideoId) || videos[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setErrorMsg(null);
      try {
        await onUploadVideo(e.target.files[0]);
      } catch (err: any) {
        setErrorMsg(err.message || 'Upload failed');
      }
    }
  };

  const handleScanHighlights = async () => {
    if (!selectedVideo) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await api.analyzeVideo(selectedVideo.id, targetDuration);
      setCandidates(res.candidates);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRenderClip = async (candidate: HighlightCandidate, index: number) => {
    if (!selectedVideo) return;
    setRenderingIndex(index);
    setErrorMsg(null);
    try {
      const clip = await api.cutClip(selectedVideo.id, {
        title: candidate.title,
        hook: candidate.hook,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        viralityScore: candidate.viralityScore,
        viralityReason: candidate.viralityReason,
        suggestedCaption: candidate.suggestedCaption,
        aspectRatio: '9:16',
        captionStyle: 'bold-yellow',
      });
      onClipCreated(clip);
    } catch (err: any) {
      setErrorMsg(err.message || 'Clip rendering failed');
    } finally {
      setRenderingIndex(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', backgroundColor: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: '#fca5a5' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Workspace Grid */}
      <div className="studio-grid">
        {/* Left Column: Video Selector & Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">1. Select Source Video</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {videos.length} videos available
              </span>
            </div>

            {videos.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <Layers className="empty-icon" />
                <h3 className="empty-title">No videos ingested yet</h3>
                <p className="empty-desc">
                  Upload an MP4 recording or click below to generate an instant synthetic test video using local FFmpeg.
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onDemoClick}
                  disabled={isGeneratingDemo}
                >
                  <Play size={14} />
                  <span>{isGeneratingDemo ? 'Generating Demo...' : 'Create Sample Video'}</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Active Source Video</label>
                  <select
                    className="form-select"
                    value={selectedVideo?.id || ''}
                    onChange={(e) => {
                      setSelectedVideoId(e.target.value);
                      setCandidates([]);
                    }}
                  >
                    {videos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} ({Math.round(v.duration)}s &bull; {(v.fileSize / (1024 * 1024)).toFixed(1)} MB)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedVideo && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#000', maxHeight: '380px' }}>
                      <video
                        src={selectedVideo.urlPath}
                        controls
                        style={{ width: '100%', maxHeight: '380px', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Resolution: {selectedVideo.width}x{selectedVideo.height}</span>
                      <span>Duration: {Math.round(selectedVideo.duration)}s</span>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: '#fca5a5' }}
                        onClick={() => onDeleteVideo(selectedVideo.id)}
                      >
                        <Trash2 size={13} />
                        <span>Delete Video</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ingestion & Highlight Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Upload Dropzone */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Ingest New Video</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Upload local MP4, MOV, or WebM files. Files remain on your machine with 0 external hosting charges.
            </p>

            <label className="dropzone-container" style={{ display: 'block' }}>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Upload size={24} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Click to browse video file
              </div>
              <small>MP4, WebM up to 500MB</small>
            </label>
          </div>

          {/* AI Clipper Configuration */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>2. Detect High-Retention Moments</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Scans video structure for punchy hooks and viral segment timestamps.
            </p>

            <div className="form-group">
              <label className="form-label">Target Clip Duration</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${targetDuration === 15 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetDuration(15)}
                >
                  15s (Rapid)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${targetDuration === 30 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetDuration(30)}
                >
                  30s (Optimal)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${targetDuration === 60 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetDuration(60)}
                >
                  60s (Detailed)
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={!selectedVideo || isAnalyzing}
              onClick={handleScanHighlights}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Scanning Video Moments...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Scan for Viral Highlights</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Highlight Candidates Section */}
      {candidates.length > 0 && (
        <section aria-labelledby="candidates-heading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 id="candidates-heading" style={{ fontSize: '1.2rem' }}>
                3. Detected Candidate Clips ({candidates.length})
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Review timestamps, hook lines, and click Render to generate vertical 9:16 video via local FFmpeg.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {candidates.map((cand, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#93c5fd', borderColor: 'var(--accent-border)', fontWeight: 600 }}>
                    Score: {cand.viralityScore}/100
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    <span>{Math.round(cand.startTime)}s - {Math.round(cand.endTime)}s ({Math.round(cand.duration)}s)</span>
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.3rem' }}>{cand.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontStyle: 'italic', backgroundColor: 'var(--bg-canvas)', padding: '0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                    "{cand.hook}"
                  </p>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>Retention Rationale:</strong> {cand.viralityReason}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    disabled={renderingIndex !== null}
                    onClick={() => handleRenderClip(cand, idx)}
                  >
                    {renderingIndex === idx ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Rendering 9:16 Vertical Clip with FFmpeg...</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={14} />
                        <span>Render 9:16 Clip (FFmpeg)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
