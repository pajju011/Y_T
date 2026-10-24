import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import type { ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { DashboardView } from './views/DashboardView';
import { StudioView } from './views/StudioView';
import { StrategyView } from './views/StrategyView';
import { ApprovalsView } from './views/ApprovalsView';
import { CalendarView } from './views/CalendarView';
import { TrendsView } from './views/TrendsView';
import { IntegrationsView } from './views/IntegrationsView';
import { SettingsView } from './views/SettingsView';
import { LegalView } from './views/LegalView';
import { api } from './api';
import type {
  MetricsData,
  VideoRecord,
  ClipRecord,
  TrendItem,
  IntegrationRecord,
  SystemInfo
} from './api';
import './styles/design-system.css';
import './styles/app.css';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [clips, setClips] = useState<ClipRecord[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const [activePreviewClip, setActivePreviewClip] = useState<ClipRecord | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshData = async () => {
    try {
      const [m, v, c, t, i, s] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getVideos().catch(() => []),
        api.getClips().catch(() => []),
        api.getTrends().catch(() => []),
        api.getIntegrations().catch(() => []),
        api.getSystemInfo().catch(() => null),
      ]);

      if (m) setMetrics(m);
      setVideos(v);
      setClips(c);
      setTrends(t);
      setIntegrations(i);
      if (s) setSystemInfo(s);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUploadVideo = async (file: File) => {
    showToast(`Uploading ${file.name}...`);
    try {
      const newVideo = await api.uploadVideo(file);
      await refreshData();
      showToast(`Successfully ingested "${newVideo.title}"`);
      setActiveTab('studio');
    } catch (err: any) {
      showToast(`Upload error: ${err.message}`);
      throw err;
    }
  };

  const handleImportYouTube = async (url: string) => {
    showToast(`Downloading YouTube video via yt-dlp...`);
    try {
      const newVideo = await api.importYouTubeVideo(url);
      await refreshData();
      showToast(`Successfully imported "${newVideo.title}"!`);
      setActiveTab('studio');
    } catch (err: any) {
      showToast(`YouTube import failed: ${err.message}`);
      throw err;
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadVideo(e.target.files[0]);
    }
  };

  const handleCreateDemoVideo = async () => {
    setIsGeneratingDemo(true);
    showToast('Generating synthetic test video with local FFmpeg...');
    try {
      const demo = await api.createDemoVideo();
      await refreshData();
      showToast(`Created sample video: "${demo.title}"`);
      setActiveTab('studio');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video and all associated clips?')) {
      try {
        await api.deleteVideo(id);
        await refreshData();
        showToast('Video and associated media removed.');
      } catch (err: any) {
        showToast(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleClipCreated = async (clip: ClipRecord) => {
    await refreshData();
    showToast(`Clip "${clip.title}" rendered with local FFmpeg!`);
    setActivePreviewClip(clip);
  };

  const handleUpdateClip = async (id: string, updates: Partial<ClipRecord>) => {
    try {
      await api.updateClip(id, updates);
      await refreshData();
      showToast('Clip updated.');
      if (activePreviewClip && activePreviewClip.id === id) {
        setActivePreviewClip({ ...activePreviewClip, ...updates });
      }
    } catch (err: any) {
      showToast(`Update error: ${err.message}`);
    }
  };

  const handleDeleteClip = async (id: string) => {
    if (window.confirm('Permanently delete this clip?')) {
      try {
        await api.deleteClip(id);
        await refreshData();
        showToast('Clip deleted.');
        if (activePreviewClip && activePreviewClip.id === id) {
          setActivePreviewClip(null);
        }
      } catch (err: any) {
        showToast(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleUpdateIntegration = async (platform: string, data: any) => {
    try {
      await api.updateIntegration(platform, data);
      await refreshData();
      showToast(`Integration updated.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Workspace Dashboard',
          description: 'Production metrics, library overview, and active publishing pipeline.'
        };
      case 'studio':
        return {
          title: 'Module A: AI Clip Maker',
          description: 'Ingest local or YouTube videos, detect viral moments, and render 9:16 vertical shorts.'
        };
      case 'strategy':
        return {
          title: 'Module B: AI Trend Studio — Content Strategy',
          description: 'Configure your daily publishing strategy, target audience, and autonomous trend pipeline.'
        };
      case 'trends':
        return {
          title: 'Live Trend Radar & Discovery',
          description: 'Scan live RSS feeds for breaking topics and generate 9:16 videos with zero uploads.'
        };
      case 'approvals':
        return {
          title: 'Review & Approvals Pipeline',
          description: 'Review auto-detected hooks, edit captions, and approve clips before publishing.'
        };
      case 'calendar':
        return {
          title: 'Publishing Calendar',
          description: 'View scheduled clips organized across publishing dates and channels.'
        };
      case 'integrations':
        return {
          title: 'Channel Integrations',
          description: 'Manage connections to YouTube Shorts, TikTok, Instagram, and LinkedIn.'
        };
      case 'settings':
        return {
          title: 'Settings & 100% Free Setup',
          description: 'Configure free AI provider keys, inspect local FFmpeg, and setup DNS.'
        };
      case 'legal':
        return {
          title: 'Credibility, Compliance & Transparency',
          description: 'Privacy policies, terms of service, and transparent AI disclosures.'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/mp4,video/quicktime,video/webm"
        style={{ display: 'none' }}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        systemInfo={systemInfo}
      />

      <main className="app-main">
        <Header
          title={pageInfo.title}
          description={pageInfo.description}
          systemInfo={systemInfo}
          onUploadClick={() => fileInputRef.current?.click()}
          onDemoClick={handleCreateDemoVideo}
          isGeneratingDemo={isGeneratingDemo}
        />

        <div className="app-content">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              clips={clips}
              videos={videos}
              setActiveTab={setActiveTab}
              onPreviewClip={(clip) => setActivePreviewClip(clip)}
              onDemoClick={handleCreateDemoVideo}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          )}

          {activeTab === 'studio' && (
            <StudioView
              videos={videos}
              onUploadVideo={handleUploadVideo}
              onImportYouTube={handleImportYouTube}
              onDemoClick={handleCreateDemoVideo}
              isGeneratingDemo={isGeneratingDemo}
              onClipCreated={handleClipCreated}
              onDeleteVideo={handleDeleteVideo}
            />
          )}

          {activeTab === 'strategy' && (
            <StrategyView
              setActiveTab={setActiveTab}
              onRefreshAll={refreshData}
            />
          )}

          {activeTab === 'trends' && (
            <TrendsView
              trends={trends}
              setActiveTab={setActiveTab}
              onRefreshAll={refreshData}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsView
              clips={clips}
              onPreviewClip={(clip) => setActivePreviewClip(clip)}
              onUpdateClip={handleUpdateClip}
              onDeleteClip={handleDeleteClip}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              clips={clips}
              onPreviewClip={(clip) => setActivePreviewClip(clip)}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsView
              integrations={integrations}
              onUpdateIntegration={handleUpdateIntegration}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              systemInfo={systemInfo}
              onRefreshSystem={refreshData}
            />
          )}

          {activeTab === 'legal' && (
            <LegalView />
          )}
        </div>
      </main>

      {/* Video Preview Modal */}
      {activePreviewClip && (
        <VideoPlayerModal
          clip={activePreviewClip}
          onClose={() => setActivePreviewClip(null)}
          onUpdateStatus={(id, status) => handleUpdateClip(id, { status })}
          onUpdateCaptionStyle={(id, captionStyle) => handleUpdateClip(id, { captionStyle })}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container" role="status" aria-live="polite">
          <div className="toast">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
