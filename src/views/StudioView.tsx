import React, { useState } from 'react';
import {
  Upload,
  Scissors,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Trash2,
  Loader2,
  Tv,
  Type,
  Cloud
} from 'lucide-react';
import type { VideoRecord, HighlightCandidate, ClipRecord, FramingMode } from '../api';
import { api } from '../api';

const YoutubeIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 14, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface StudioViewProps {
  videos: VideoRecord[];
  onUploadVideo: (file: File) => Promise<void>;
  onImportYouTube: (url: string) => Promise<void>;
  onClipCreated: (clip: ClipRecord) => void;
  onDeleteVideo: (id: string) => Promise<void>;
}

export const StudioView: React.FC<StudioViewProps> = ({
  videos,
  onUploadVideo,
  onImportYouTube,
  onClipCreated,
  onDeleteVideo,
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>(videos[0]?.id || '');
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [framingMode, setFramingMode] = useState<FramingMode>('center');
  const [captionStyle, setCaptionStyle] = useState<'bold-yellow' | 'minimal-white' | 'karaoke-blue' | 'none'>('bold-yellow');
  const [ingestMode, setIngestMode] = useState<'upload' | 'youtube'>('upload');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [isDownloadingYt, setIsDownloadingYt] = useState<boolean>(false);

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

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    setIsDownloadingYt(true);
    setErrorMsg(null);
    try {
      await onImportYouTube(youtubeUrl.trim());
      setYoutubeUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'YouTube download failed');
    } finally {
      setIsDownloadingYt(false);
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
        framingMode: framingMode,
        captionStyle: captionStyle,
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

      {/* Quick Visual Instructions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="badge" style={{ backgroundColor: 'var(--accent-subtle)', color: '#93c5fd', borderColor: 'var(--accent-border)' }}>
            Studio Guide
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            1. Select video below &rarr; 2. Click <strong>Detect Viral Highlights</strong> &rarr; 3. Render 9:16 vertical short.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', borderColor: 'var(--success-border)' }}>
            <Cloud size={12} />
            <span>Google Drive Sync Ready</span>
          </span>
        </div>
      </div>

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
              <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                <Layers className="empty-icon" />
                <h3 className="empty-title">No videos ingested yet</h3>
                <p className="empty-desc">
                  Upload your video file (MP4, MOV, WebM) or paste a YouTube URL using the panel on the right.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setIngestMode('upload')}
                  >
                    <Upload size={14} />
                    <span>Upload Local File</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIngestMode('youtube')}
                  >
                    <YoutubeIcon size={14} style={{ color: '#f87171' }} />
                    <span>YouTube Import</span>
                  </button>
                </div>
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
          {/* Ingestion Panel with Tabs */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 className="card-title">Ingest Video Source</h3>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  className={`btn btn-sm ${ingestMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIngestMode('upload')}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                >
                  <Upload size={12} />
                  <span>Local File</span>
                </button>
                <button
                  className={`btn btn-sm ${ingestMode === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIngestMode('youtube')}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                >
                  <YoutubeIcon size={12} />
                  <span>YouTube URL</span>
                </button>
              </div>
            </div>

            {ingestMode === 'upload' ? (
              <label className="dropzone-container" style={{ display: 'block' }}>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Upload size={22} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.4rem auto' }} />
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Click to browse local video file
                </div>
                <small>MP4, WebM up to 500MB</small>
              </label>
            ) : (
              <form onSubmit={handleYouTubeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Paste YouTube URL (Podcast / Video)</label>
                  <input
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <span className="form-hint">Downloads directly using built-in yt-dlp ($0 cost).</span>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isDownloadingYt || !youtubeUrl.trim()}>
                  {isDownloadingYt ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Downloading Video...</span>
                    </>
                  ) : (
                    <>
                      <YoutubeIcon size={14} />
                      <span>Download & Import</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Video Formatting & Clipper Configuration */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>2. Output Framing & Subtitles</h3>

            {/* Smart Framing Mode */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tv size={14} />
                <span>Smart Framing (Speaker Positioning)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${framingMode === 'center' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFramingMode('center')}
                  title="Crops center 9:16 (standard single speaker)"
                >
                  Center Crop
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${framingMode === 'blur_fit' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFramingMode('blur_fit')}
                  title="Preserves entire widescreen video with blurred top/bottom padding"
                >
                  Cinematic Blur Fit
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${framingMode === 'left' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFramingMode('left')}
                  title="Crops left speaker in 2-person podcast"
                >
                  Left Speaker
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${framingMode === 'right' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFramingMode('right')}
                  title="Crops right speaker in 2-person podcast"
                >
                  Right Speaker
                </button>
              </div>
            </div>

            {/* Burned-in Subtitle Styling */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Type size={14} />
                <span>Burned-in Caption Style (Hardcoded into MP4)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'bold-yellow' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCaptionStyle('bold-yellow')}
                >
                  Bold Yellow (Hormozi)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'minimal-white' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCaptionStyle('minimal-white')}
                >
                  Minimal White
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'karaoke-blue' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCaptionStyle('karaoke-blue')}
                >
                  Karaoke Sky Blue
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${captionStyle === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCaptionStyle('none')}
                >
                  No Subtitles
                </button>
              </div>
            </div>

            {/* Target Duration */}
            <div className="form-group">
              <label className="form-label">Target Clip Duration</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
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
              style={{ width: '100%', marginTop: '0.25rem' }}
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
                Renders 9:16 vertical video with <strong>{framingMode.replace('_', ' ')} framing</strong> and <strong>{captionStyle} burned captions</strong>.
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
                        <span>Rendering 9:16 Video + Burned Subtitles (FFmpeg)...</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={14} />
                        <span>Render 9:16 Clip + Burn Subtitles</span>
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
