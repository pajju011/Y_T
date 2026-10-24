import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Eye,
  Download
} from 'lucide-react';
import type { ClipRecord } from '../api';

interface CalendarViewProps {
  clips: ClipRecord[];
  onPreviewClip: (clip: ClipRecord) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  clips,
  onPreviewClip,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedDayClips, setSelectedDayClips] = useState<{ dateStr: string; clips: ClipRecord[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Scheduled clips filter
  const scheduledClips = clips.filter(c => {
    if (c.status !== 'scheduled' && c.status !== 'published') return false;
    if (platformFilter !== 'all' && !c.platforms.includes(platformFilter as any)) return false;
    return Boolean(c.scheduledDate);
  });

  // Build grid days
  const calendarCells = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarCells.push({
      day,
      isCurrentMonth: false,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateStr,
    });
  }

  // Next month padding to complete 35 or 42 cells
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(n).padStart(2, '0')}`,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 className="calendar-month-title">
            {monthNames[month]} {year}
          </h2>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="btn btn-outline btn-sm" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-outline btn-sm" onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Platform:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">All Channels</option>
            <option value="youtube">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram Reels</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}

        {calendarCells.map((cell, idx) => {
          const dayClips = scheduledClips.filter(c => c.scheduledDate === cell.dateStr);
          const isToday = cell.dateStr === todayStr;

          return (
            <div
              key={idx}
              className={`calendar-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => {
                if (dayClips.length > 0) {
                  setSelectedDayClips({ dateStr: cell.dateStr, clips: dayClips });
                }
              }}
              style={{ cursor: dayClips.length > 0 ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="cell-day-num" style={{ color: isToday ? '#60a5fa' : undefined, fontWeight: isToday ? 700 : 500 }}>
                  {cell.day}
                </span>
                {dayClips.length > 0 && (
                  <span className="badge" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem', backgroundColor: 'var(--accent-subtle)', color: '#93c5fd' }}>
                    {dayClips.length}
                  </span>
                )}
              </div>

              {dayClips.slice(0, 2).map((clip) => (
                <div key={clip.id} className="calendar-event-pill" title={`${clip.title} (${clip.scheduledTime || '12:00'})`}>
                  {clip.scheduledTime && `${clip.scheduledTime} `}
                  {clip.title}
                </div>
              ))}

              {dayClips.length > 2 && (
                <small style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  +{dayClips.length - 2} more
                </small>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Drawer for Selected Date */}
      {selectedDayClips && (
        <div className="card" style={{ marginTop: '1rem', borderLeft: '3px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={16} />
              <span>Scheduled Posts for {selectedDayClips.dateStr}</span>
            </h3>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedDayClips(null)}>
              Close
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selectedDayClips.clips.map((clip) => (
              <div
                key={clip.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{clip.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <span>Time: {clip.scheduledTime || '12:00'}</span>
                    <span>Channels: {clip.platforms.join(', ')}</span>
                    <span>Duration: {Math.round(clip.duration)}s</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => onPreviewClip(clip)}>
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>
                  <a href={clip.urlPath} download={`${clip.title}.mp4`} className="btn btn-outline btn-sm">
                    <Download size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
