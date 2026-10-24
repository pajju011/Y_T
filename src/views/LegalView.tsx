import React, { useState } from 'react';
import { FileText, Cpu, Lock } from 'lucide-react';

export const LegalView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'privacy' | 'terms' | 'ai-transparency'>('privacy');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '980px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem' }}>Credibility, Compliance & Legal Transparency</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Detailed, honest disclosure of data handling, video privacy, AI model usage, and terms of service.
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          className={`btn btn-sm ${activeDoc === 'privacy' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDoc('privacy')}
        >
          <Lock size={14} />
          <span>Privacy Policy</span>
        </button>

        <button
          className={`btn btn-sm ${activeDoc === 'terms' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDoc('terms')}
        >
          <FileText size={14} />
          <span>Terms of Service</span>
        </button>

        <button
          className={`btn btn-sm ${activeDoc === 'ai-transparency' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDoc('ai-transparency')}
        >
          <Cpu size={14} />
          <span>AI Usage Disclosure</span>
        </button>
      </div>

      {/* Privacy Policy */}
      {activeDoc === 'privacy' && (
        <div className="card" style={{ padding: '1.75rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span className="badge badge-approved" style={{ marginBottom: '0.5rem' }}>Effective Date: October 2026</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>ClipGenius AI Privacy Policy</h3>
          </div>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>1. Local Video Storage & Processing</h4>
            <p style={{ fontSize: '0.875rem' }}>
              All video files uploaded to ClipGenius AI are stored locally within your workspace under the <code className="docs-code">uploads/</code> directory on your host filesystem. We do not upload your video files to any third-party cloud hosting or analytics servers without your explicit connection.
            </p>
          </section>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>2. AI Provider Data Transmission</h4>
            <p style={{ fontSize: '0.875rem' }}>
              When you choose to use Google Gemini or Groq API integrations, video metadata, duration, titles, and transcript snippets are transmitted strictly through your personal API keys to the respective provider's endpoints. Under Google AI Studio free tier terms, your prompts are processed in accordance with Google's API service terms. If you prefer 100% air-gapped processing, you can use ClipGenius AI's built-in Local Pattern Engine or Local Ollama.
            </p>
          </section>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>3. Social Account Connections & Credentials</h4>
            <p style={{ fontSize: '0.875rem' }}>
              ClipGenius AI does not collect, sell, or monetize user data. Connected channel handles and API tokens are stored solely in your local JSON database (<code className="docs-code">data/db.json</code>). You retain absolute control over deleting any token or disconnecting any integration at any time.
            </p>
          </section>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>4. Data Deletion</h4>
            <p style={{ fontSize: '0.875rem' }}>
              Deleting a video or clip within ClipGenius AI permanently purges both the database record and the underlying MP4 file from your disk.
            </p>
          </section>
        </div>
      )}

      {/* Terms of Service */}
      {activeDoc === 'terms' && (
        <div className="card" style={{ padding: '1.75rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span className="badge badge-approved" style={{ marginBottom: '0.5rem' }}>Effective Date: October 2026</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>ClipGenius AI Terms of Service</h3>
          </div>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>1. Content Ownership</h4>
            <p style={{ fontSize: '0.875rem' }}>
              You retain 100% intellectual property ownership of all original video footage, audio, and generated clips processed through ClipGenius AI. ClipGenius AI claims no copyright or proprietary interest in your media.
            </p>
          </section>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>2. Acceptable Use</h4>
            <p style={{ fontSize: '0.875rem' }}>
              You agree not to process media that infringes on third-party copyrights or violates applicable laws and social platform terms (such as YouTube Community Guidelines or TikTok Terms of Service).
            </p>
          </section>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>3. No Virality or Performance Guarantees</h4>
            <p style={{ fontSize: '0.875rem' }}>
              ClipGenius AI provides tools for automated video editing, hook framing, and caption generation. Algorithmic distribution, view counts, follower growth, and monetization are determined solely by external platform algorithms and audience discretion. No performance metrics are guaranteed.
            </p>
          </section>
        </div>
      )}

      {/* AI Usage Disclosure */}
      {activeDoc === 'ai-transparency' && (
        <div className="card" style={{ padding: '1.75rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span className="badge badge-scheduled" style={{ marginBottom: '0.5rem' }}>Transparent AI Disclosure</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Usage & Human-in-the-Loop Protocol</h3>
          </div>

          <div className="docs-callout">
            <strong>Production Standard:</strong> ClipGenius AI mandates a Human-in-the-Loop approval step. AI generates candidate clip timestamps and suggested captions; you must review and approve them before they are published.
          </div>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Where AI Is Used</h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <li><strong>Highlight Detection:</strong> Natural language processing identifies conversational hooks, thesis statements, and punchlines.</li>
              <li><strong>Caption Generation:</strong> Suggests concise, platform-optimized captions and tags based on transcript context.</li>
              <li><strong>Retention Scoring:</strong> Scores clips from 0 to 100 based on initial hook strength and narrative completeness.</li>
            </ul>
          </section>

          <section>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Where AI Is NOT Used</h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <li><strong>Fake Engagement:</strong> No fake view counts, simulated subscriber metrics, or synthetic comments.</li>
              <li><strong>Unsupervised Publishing:</strong> Posts are never published automatically without creator review unless explicitly scheduled.</li>
              <li><strong>Deceptive Clones:</strong> Audio and video remain your genuine recorded media.</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
