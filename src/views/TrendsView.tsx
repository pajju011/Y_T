import React, { useState } from 'react';
import {
  Copy,
  Check,
  ArrowRight,
  Clock
} from 'lucide-react';
import type { TrendItem } from '../api';
import type { ActiveTab } from '../components/Sidebar';

interface TrendsViewProps {
  trends: TrendItem[];
  setActiveTab: (tab: ActiveTab) => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({ trends, setActiveTab }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['all', 'Tech & AI', 'Finance & Business', 'Productivity', 'Creator Economy'];

  const filteredTrends = selectedCategory === 'all'
    ? trends
    : trends.filter(t => t.category === selectedCategory);

  const copyHook = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Trend & Hook Structure Radar</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            High-retention storytelling frameworks designed to structure your short clips effectively.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All Frameworks' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Banner */}
      <div className="docs-callout">
        <strong>Strategic Notice:</strong> Trend templates provide narrative pacing and structural retention. Pacing, clear audio delivery, and genuine topical substance dictate audience engagement. No platform guarantees views or algorithmic distribution.
      </div>

      {/* Grid of Trend Frameworks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {filteredTrends.map((trend) => (
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
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>OPENING HOOK TEMPLATE</span>
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

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {trend.sampleTags.map((t, idx) => (
                <span key={idx} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-xs)' }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Action */}
            <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => setActiveTab('studio')}
              >
                <span>Apply to Video in Studio</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
