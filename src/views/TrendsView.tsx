import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Flame,
  Radio,
  Loader2,
  Video,
  Search,
  Layers
} from 'lucide-react';
import type { TrendItem, LiveTrend } from '../api';
import { api } from '../api';
import type { ActiveTab } from '../components/Sidebar';

interface TrendsViewProps {
  trends: TrendItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onRefreshAll?: () => Promise<void>;
}

export const TrendsView: React.FC<TrendsViewProps> = ({ trends, setActiveTab, onRefreshAll }) => {
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'frameworks'>('live');
  const [liveTrends, setLiveTrends] = useState<LiveTrend[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tech & AI');
  const [searchTopic, setSearchTopic] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [generatingTrendId, setGeneratingTrendId] = useState<string | null>(null);
  const [cardFrameworks, setCardFrameworks] = useState<Record<string, string>>({});

  const categories = [
    'Tech & AI',
    'Google Daily Trends',
    'Finance & Business',
    'Productivity',
    'Creator Economy',
    'Gaming',
    'Science & Future',
    'all'
  ];

  const frameworkOptions = [
    { id: 'pas', name: 'Problem-Agitate-Solve' },
    { id: 'contrarian', name: 'The Contrarian Truth' },
    { id: 'before_after', name: 'Before-After-Bridge' },
    { id: 'three_step', name: '3-Step Framework' }
  ];

  useEffect(() => {
    loadLiveTrends();
  }, []);

  const loadLiveTrends = async () => {
    try {
      const data = await api.getLiveTrends();
      if (data && data.length > 0) {
        setLiveTrends(data);
      } else {
        handleFetchFreshTrends('Tech & AI');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchFreshTrends = async (cat?: string) => {
    setIsDiscovering(true);
    try {
      const targetNiche = cat && cat !== 'all' ? cat : 'Tech & AI';
      const fresh = await api.discoverTrends(targetNiche);
      setLiveTrends(fresh);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTopic.trim()) return;
    setIsDiscovering(true);
    try {
      const results = await api.searchTrends(searchTopic.trim());
      setLiveTrends(results);
      setSelectedCategory('all');
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleGenerateVideoFromTrend = async (trend: LiveTrend) => {
    setGeneratingTrendId(trend.id);
    const chosenFramework = cardFrameworks[trend.id] || 'Problem-Agitate-Solve';
    try {
      await api.generateVideoFromTrend(trend.id, trend, chosenFramework);
      if (onRefreshAll) await onRefreshAll();
      setActiveTab('approvals');
    } catch (err: any) {
      alert(`Video generation failed: ${err.message}`);
    } finally {
      setGeneratingTrendId(null);
    }
  };

  const copyHook = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFrameworks = selectedCategory === 'all' || selectedCategory === 'Google Daily Trends'
    ? trends
    : trends.filter(t => t.category.toLowerCase().includes(selectedCategory.toLowerCase()) || selectedCategory.toLowerCase().includes(t.category.toLowerCase()));

  const filteredLiveTrends = selectedCategory === 'all'
    ? liveTrends
    : liveTrends.filter(t => {
        if (selectedCategory === 'Google Daily Trends') {
          return t.niche === 'Google Daily Trends' || t.title.startsWith('Trending:');
        }
        return t.niche === selectedCategory || (selectedCategory === 'Tech & AI' && t.niche.includes('Tech'));
      });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>AI Trend Studio — Live Radar & Storytelling Frameworks</h2>
            <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#93c5fd', borderColor: 'var(--accent-border)' }}>
              Module B
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time verified news from Google Trends & RSS paired with viral hook frameworks to generate complete 9:16 videos with zero upload required.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'live' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('live')}
          >
            <Radio size={14} />
            <span>Live RSS & Google Trends</span>
            {liveTrends.length > 0 && <span style={{ opacity: 0.8, marginLeft: '0.2rem' }}>({liveTrends.length})</span>}
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'frameworks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('frameworks')}
          >
            <Sparkles size={14} />
            <span>Hook Frameworks ({trends.length})</span>
          </button>
        </div>
      </div>

      {/* Instant Search Bar & Refresh Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search any live trend topic across Google News (e.g. OpenAI, Nvidia, Bitcoin, DeepSeek)..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" disabled={isDiscovering}>
            <span>Search Live Topic</span>
          </button>
        </form>

        {/* Category Pills & Refresh Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (activeSubTab === 'live') {
                    handleFetchFreshTrends(cat);
                  }
                }}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
              >
                {cat === 'all' ? 'All Cached' : cat === 'Google Daily Trends' ? '🔥 Google Daily Trends' : cat}
              </button>
            ))}
          </div>

          {activeSubTab === 'live' && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleFetchFreshTrends(selectedCategory)}
              disabled={isDiscovering}
            >
              <RefreshCw size={13} className={isDiscovering ? 'animate-spin' : ''} />
              <span>{isDiscovering ? 'Scanning RSS Feeds...' : 'Refresh Trends'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: LIVE RSS & GOOGLE TRENDS */}
      {activeSubTab === 'live' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredLiveTrends.length === 0 ? (
            <div className="empty-state">
              <Flame className="empty-icon" />
              <h3 className="empty-title">No live trends found for this niche</h3>
              <p className="empty-desc">
                Click below to query Google Daily Trends and verified Google News RSS publications for current breaking stories.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleFetchFreshTrends(selectedCategory)}
                disabled={isDiscovering}
              >
                <RefreshCw size={14} className={isDiscovering ? 'animate-spin' : ''} />
                <span>Fetch Current Trends Now</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {filteredLiveTrends.map((t) => (
                <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#93c5fd', borderColor: 'var(--accent-border)', fontWeight: 600 }}>
                      Relevance: {t.relevanceScore}/100
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Source: {t.source}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem', lineHeight: 1.35 }}>
                      {t.title}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {t.snippet}
                    </p>
                  </div>

                  {t.url && (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                    >
                      <span>Read Original Article</span>
                      <ExternalLink size={11} />
                    </a>
                  )}

                  {/* Storytelling Framework Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Layers size={11} />
                        <span>Story Framework:</span>
                      </span>
                    </div>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                      value={cardFrameworks[t.id] || 'Problem-Agitate-Solve'}
                      onChange={(e) => setCardFrameworks({ ...cardFrameworks, [t.id]: e.target.value })}
                    >
                      {frameworkOptions.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 1-Click Text-To-Video Generation Action */}
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    disabled={generatingTrendId !== null}
                    onClick={() => handleGenerateVideoFromTrend(t)}
                  >
                    {generatingTrendId === t.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Rendering 9:16 Video (FFmpeg + Script)...</span>
                      </>
                    ) : (
                      <>
                        <Video size={14} />
                        <span>Generate 9:16 Video (0 Uploads Needed)</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: HOOK & STORYTELLING FRAMEWORKS */}
      {activeSubTab === 'frameworks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredFrameworks.map((trend) => (
            <div key={trend.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#93c5fd', borderColor: 'var(--accent-border)' }}>
                  {trend.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} />
                  <span>Target: {trend.targetDuration}</span>
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem' }}>{trend.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{trend.description}</p>
              </div>

              {/* Hook Template Box */}
              <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>OPENING HOOK TEMPLATE</span>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem' }}
                    onClick={() => copyHook(trend.id, trend.hookTemplate)}
                  >
                    {copiedId === trend.id ? (
                      <>
                        <Check size={12} style={{ color: 'var(--success)' }} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Hook</span>
                      </>
                    )}
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                  "{trend.hookTemplate}"
                </p>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setActiveSubTab('live');
                    handleFetchFreshTrends(trend.category);
                  }}
                >
                  <Sparkles size={13} />
                  <span>Explore Live Trends for this Niche</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
