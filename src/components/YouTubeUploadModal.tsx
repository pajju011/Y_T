import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Check,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../api';
import type { ClipRecord, IntegrationRecord } from '../api';

interface YouTubeUploadModalProps {
  clip: ClipRecord | null;
  onClose: () => void;
  onSuccess: (updatedClip: ClipRecord, youtubeUrl: string) => void;
  integrations?: IntegrationRecord[];
}

export const YouTubeUploadModal: React.FC<YouTubeUploadModalProps> = ({
  clip,
  onClose,
  onSuccess,
  integrations = []
}) => {
  if (!clip) return null;

  const isShort = clip.aspectRatio === '9:16';
  const defaultTitle = isShort && !clip.title.includes('#Shorts')
    ? `${clip.title} #Shorts`
    : clip.title;

  const defaultDescription = isShort && !clip.suggestedCaption.includes('#Shorts')
    ? `${clip.suggestedCaption}\n\n#Shorts #ClipGenius #AI`
    : clip.suggestedCaption;

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [tags, setTags] = useState('Shorts, clipgenius, trending, viral, ai');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('public');
  const [categoryId, setCategoryId] = useState('22'); // 22 = People & Blogs, 28 = Science & Tech
  const [accessToken, setAccessToken] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<{ videoId: string; url: string } | null>(null);

  // Check if YouTube integration already has a saved token
  const ytIntegration = integrations.find(i => i.platform === 'youtube');
  const hasSavedToken = Boolean((ytIntegration as any)?.accessToken);

  useEffect(() => {
    if ((ytIntegration as any)?.accessToken) {
      setAccessToken((ytIntegration as any).accessToken);
    }
  }, [ytIntegration]);

  const handleUpload = async () => {
    if (!title.trim()) {
      setUploadError('Please provide a video title.');
      return;
    }

    if (!accessToken.trim() && !hasSavedToken) {
      setUploadError('YouTube Access Token is required. Paste your token or connect via Google Cloud.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.publishToYouTube(clip.id, {
        accessToken: accessToken.trim(),
        privacyStatus,
        title: title.trim(),
        description: description.trim(),
        tags: tagList,
        categoryId
      });

      setUploadedResult(res);
      const updated: ClipRecord = {
        ...clip,
        status: 'published',
        publishedAt: new Date().toISOString(),
        youtubeVideoUrl: res.url,
        youtubeVideoId: res.videoId
      };
      onSuccess(updated, res.url);
    } catch (err: any) {
      console.error('YouTube upload failed:', err);
      setUploadError(err.message || 'Failed to upload video to YouTube. Check token permissions.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
                Upload to YouTube {isShort ? 'Shorts' : 'Channel'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Publish directly via YouTube Data API v3 • {isShort ? '9:16 Vertical Short' : '16:9 Landscape'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Success State */}
        {uploadedResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1.25rem',
              backgroundColor: 'var(--success-subtle)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              color: '#6ee7b7'
            }}>
              <Check size={28} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff' }}>Video Successfully Uploaded to YouTube!</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#a7f3d0' }}>
                  Your video is live on YouTube. Status: <strong>{privacyStatus.toUpperCase()}</strong>.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {uploadedResult.url}
              </span>
              <a
                href={uploadedResult.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                <span>Watch on YouTube</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '0.75rem' }}>
            {uploadError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#fca5a5',
                fontSize: '0.85rem'
              }}>
                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Upload Error:</strong> {uploadError}
                </div>
              </div>
            )}

            {/* Title */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Video Title (max 100 characters)</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{title.length}/100</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter compelling title..."
              />
              {isShort && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  Tip: #Shorts tag in title ensures placement on YouTube Shorts shelf.
                </span>
              )}
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description & Hashtags</label>
              <textarea
                className="form-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description and keywords..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Grid: Privacy & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Privacy Status</label>
                <select
                  className="form-input"
                  value={privacyStatus}
                  onChange={(e) => setPrivacyStatus(e.target.value as any)}
                >
                  <option value="public">Public (Visible to everyone)</option>
                  <option value="unlisted">Unlisted (Anyone with link)</option>
                  <option value="private">Private (Only you)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="22">People & Blogs</option>
                  <option value="28">Science & Technology</option>
                  <option value="27">Education & How-To</option>
                  <option value="24">Entertainment</option>
                  <option value="20">Gaming</option>
                  <option value="25">News & Politics</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">YouTube Tags (Comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Shorts, viral, tech, productivity"
              />
            </div>

            {/* YouTube Auth Token Section */}
            <div style={{
              padding: '0.9rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.825rem' }}>
                  Google / YouTube OAuth Access Token
                </label>
                {hasSavedToken && (
                  <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                    Connected in Integrations
                  </span>
                )}
              </div>
              <input
                type="password"
                className="form-input"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={hasSavedToken ? 'Using saved access token (or paste fresh token)' : 'ya29.a0... (Paste OAuth 2.0 access token)'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Info size={13} />
                <span>
                  Requires Google OAuth scope <code>youtube.upload</code>. Get from Google Cloud Console or OAuth Playground.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="modal-footer" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                  minWidth: '150px'
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Uploading to YouTube...</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>Publish Video Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
