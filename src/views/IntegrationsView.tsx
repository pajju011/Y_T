import React, { useState } from 'react';
import {
  Share2,
  Key,
  Check,
  Download,
  Cloud
} from 'lucide-react';
import type { IntegrationRecord } from '../api';

interface IntegrationsViewProps {
  integrations: IntegrationRecord[];
  onUpdateIntegration: (platform: string, data: { channelHandle?: string; apiKey?: string; status?: string }) => Promise<void>;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  onUpdateIntegration,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<IntegrationRecord | null>(null);
  const [channelHandle, setChannelHandle] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const openConfigModal = (integration: IntegrationRecord) => {
    setSelectedPlatform(integration);
    setChannelHandle(integration.channelHandle || '');
    setApiKey('');
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedPlatform) return;
    setIsSaving(true);
    try {
      await onUpdateIntegration(selectedPlatform.platform, {
        channelHandle,
        apiKey: apiKey.trim() ? apiKey : undefined,
        status: channelHandle ? 'connected' : 'not_configured',
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSelectedPlatform(null);
      }, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    await onUpdateIntegration(platform, {
      channelHandle: '',
      status: 'disconnected',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem' }}>Channel & Platform Integrations</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Transparent integration states with official platform developer APIs. No hidden fees or unexpected charges.
        </p>
      </div>

      {/* Free Direct Export Notice */}
      <div className="card" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '3px solid var(--success)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Download size={16} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>100% Free Manual Export Available Always</h3>
        </div>
        <p style={{ fontSize: '0.875rem' }}>
          You do not need to connect any API if you do not want to. Every rendered 9:16 clip can be downloaded directly as an MP4 file with burned captions and dragged into YouTube Shorts, TikTok, or Instagram Reels in 5 seconds.
        </p>
      </div>

      {/* Integrations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {integrations.map((item) => {
          const isConnected = item.status === 'connected';

          return (
            <div key={item.platform} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: item.platform === 'google_drive' ? 'var(--success-subtle)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.platform === 'google_drive' ? (
                      <Cloud size={16} style={{ color: 'var(--success)' }} />
                    ) : (
                      <Share2 size={16} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.name}</h3>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {item.platform === 'google_drive'
                        ? (item.channelHandle || 'ClipGenius AI Vault')
                        : (item.channelHandle ? `@${item.channelHandle}` : 'Unconnected')}
                    </small>
                  </div>
                </div>

                <span className={`badge badge-${item.status}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              {/* Rate Limit and Quota Details */}
              <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Free Tier Quota:</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.dailyLimit}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                  {item.freeTierNotes}
                </p>
              </div>

              {/* Instructions */}
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>Setup Requirement:</strong> {item.instructions}
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                {isConnected ? (
                  <>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openConfigModal(item)}>
                      <span>Configure</span>
                    </button>
                    <button className="btn btn-outline btn-sm" style={{ color: '#fca5a5' }} onClick={() => handleDisconnect(item.platform)}>
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => openConfigModal(item)}>
                    <Key size={13} />
                    <span>Configure Connection</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Configuration Modal */}
      {selectedPlatform && (
        <div className="modal-backdrop" onClick={() => setSelectedPlatform(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem' }}>Configure {selectedPlatform.name}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedPlatform(null)}>
                &times;
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {selectedPlatform.instructions}
              </p>
              <div className="docs-callout" style={{ fontSize: '0.8rem' }}>
                ClipGenius AI never stores passwords or bills you for API calls. All developer keys stay in your local config file.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {selectedPlatform.platform === 'google_drive' ? 'Target Google Drive Folder Name' : 'Channel Handle or Account Name'}
              </label>
              <input
                className="form-input"
                placeholder={selectedPlatform.platform === 'google_drive' ? 'e.g. ClipGenius AI Vault' : 'e.g. MyTechChannel'}
                value={channelHandle}
                onChange={(e) => setChannelHandle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {selectedPlatform.platform === 'google_drive' ? 'Google Drive Folder Share Link or ID' : 'Developer API Key or Client Secret (Optional)'}
              </label>
              <input
                type={selectedPlatform.platform === 'google_drive' ? 'url' : 'password'}
                className="form-input"
                placeholder={selectedPlatform.platform === 'google_drive' ? 'https://drive.google.com/drive/folders/...' : 'Paste API Key / Token'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <span className="form-hint">
                {selectedPlatform.platform === 'google_drive'
                  ? 'Paste any Google Drive folder share link to auto-save and view your rendered 9:16 clips.'
                  : 'Leave blank if using manual MP4 export.'}
              </span>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPlatform(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" disabled={isSaving} onClick={handleSave}>
                {saveSuccess ? (
                  <>
                    <Check size={14} />
                    <span>Saved!</span>
                  </>
                ) : isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <span>Save Connection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
