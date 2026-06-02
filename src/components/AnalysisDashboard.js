'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertCircle, CheckCircle2, PlayCircle, ClipboardList,
  Target, TrendingUp, Star, Zap, Activity, User, Clock, MapPin,
} from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import VideoPlayer from './VideoPlayer';

const MotionViewer3D = dynamic(() => import('./MotionViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="viewer-loading">
      <div className="spinner" />
      <p className="loading-subtext">Loading 3D reference model...</p>
    </div>
  ),
});

// Maps keyword substrings → drill graphic paths
const DRILL_GRAPHICS = {
  'spray chart':       '/images/drills/spray_chart.png',
  'hitting zone':      '/images/drills/spray_chart.png',
  'fence drill':       '/images/drills/fence_drill.png',
  'towel drill':       '/images/drills/towel_drill.png',
  'pick-the-frosting': '/images/drills/drive_leg.png',
  'drive leg':         '/images/drills/drive_leg.png',
  'rounding':          '/images/drills/baserunning.png',
  'first base':        '/images/drills/baserunning.png',
  'hip':               '/images/drills/hip_rotation.svg',
  'rotation':          '/images/drills/hip_rotation.svg',
  'separation':        '/images/drills/hip_rotation.svg',
  'tee work':          '/images/drills/tee_work.svg',
  'batting tee':       '/images/drills/tee_work.svg',
  'one hand':          '/images/drills/one_handed.svg',
  'one-hand':          '/images/drills/one_handed.svg',
  'balance':           '/images/drills/balance_drill.svg',
  'flamingo':          '/images/drills/balance_drill.svg',
  'stride':            '/images/drills/balance_drill.svg',
  'arm path':          '/images/drills/arm_path.svg',
  'arm circle':        '/images/drills/arm_path.svg',
  'arm swing':         '/images/drills/arm_path.svg',
  'soft toss':         '/images/drills/soft_toss.svg',
  'front toss':        '/images/drills/soft_toss.svg',
};

// Hardcoded coaching descriptions for well-known drills
const DRILL_DESCRIPTIONS = {
  'fence drill':        'Stand 6 in. from a fence and swing. Hitting the fence on your backswing means your arc is too long. Builds a compact, inside-out path.',
  'towel drill':        'Grip a towel at the wrist and throw through your pitching motion. Proper extension snaps it; short-arming won\'t. Trains arm extension and follow-through.',
  'pick-the-frosting':  'Drive your back foot as if scraping frosting off the ground at shin height. Engages the back hip and promotes forward weight transfer.',
  'spray chart':        'Track batted-ball direction against pitch location over many swings. Reveals pull tendencies and contact-point drift.',
  'hitting zone':       'Track batted-ball direction against pitch location over many swings. Reveals pull tendencies and contact-point drift.',
  'rounding':           'Run through first base then arc toward second. Trains the proper base-path curve for aggressive baserunning.',
  'first base':         'Run through first base then arc toward second. Trains the proper base-path curve for aggressive baserunning.',
  'hip rotation':       'Feet shoulder-width, bat held horizontal at waist. Fire hips before opening shoulders — feel the delay (hip-to-shoulder separation).',
  'tee work':           'Set the tee to different heights and zones. Take 20–30 deliberate reps focused on one mechanic at a time — the most foundational hitting drill.',
  'batting tee':        'Set the tee to different heights and zones. Take 20–30 deliberate reps focused on one mechanic at a time — the most foundational hitting drill.',
  'one hand':           'Swing with a single hand. Bottom-hand drill trains palm-up contact; top-hand drill trains extension and palm-down follow-through.',
  'balance':            'Hold your leg-lift position for 3 seconds before delivering. Builds proprioception and repeatable stride mechanics.',
  'flamingo':           'Hold your leg-lift position for 3 seconds before delivering. Builds proprioception and repeatable stride mechanics.',
  'arm path':           'Slow-motion mirror work on your arm circle. Arm should travel up → back → down in a smooth loop — eliminate short-arming and early breaks.',
  'arm circle':         'Slow-motion mirror work on your arm circle. Arm should travel up → back → down in a smooth loop — eliminate short-arming and early breaks.',
  'soft toss':          'Partner kneels at 45° and tosses underhand. Focuses on contact point and hand-path without the distraction of full pitch speed.',
  'front toss':         'Partner tosses from behind an L-screen at 30–40 ft. Bridges the gap between tee work and live pitching.',
};

const getDrillGraphic = (title, drills = []) => {
  const content = (title + ' ' + drills.join(' ')).toLowerCase();
  for (const [keyword, path] of Object.entries(DRILL_GRAPHICS)) {
    if (content.includes(keyword)) return path;
  }
  return null;
};

const getDrillDescription = (drillName) => {
  const lower = drillName.toLowerCase();
  for (const [keyword, desc] of Object.entries(DRILL_DESCRIPTIONS)) {
    if (lower.includes(keyword)) return desc;
  }
  return null;
};

const levelBadgeClass = (level) => {
  if (!level) return 'badge-primary';
  if (level === 'beginner') return 'badge-warning';
  if (level === 'advanced') return 'badge-success';
  return 'badge-accent';
};

const severityColor = (s) => {
  if (s >= 8) return '#EF4444';
  if (s >= 5) return '#F59E0B';
  return '#10B981';
};

export default function AnalysisDashboard({ videoUrl, analysis }) {
  const [activeBodyRegion, setActiveBodyRegion] = useState(null);

  if (!analysis) return null;

  const sortedIssues = [...(analysis.issues || [])].sort((a, b) => b.severity - a.severity);

  const motionId = analysis.motion_type === 'pitching' ? 'pitching_windup'
                 : analysis.motion_type === 'batting'  ? 'batting_swing'
                 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Meta badges: motion type + player level */}
      {(analysis.motion_type || analysis.player_level_estimate) && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {analysis.motion_type && (
            <span className="badge badge-primary">
              {analysis.motion_type === 'pitching' ? <Zap size={12} /> : <Activity size={12} />}
              {analysis.motion_type}
            </span>
          )}
          {analysis.player_level_estimate && (
            <span className={`badge ${levelBadgeClass(analysis.player_level_estimate)}`}>
              <User size={12} />
              {analysis.player_level_estimate}
            </span>
          )}
        </div>
      )}

      {/* Row 1: Video + Summary */}
      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        <div className="card glass-panel">
          <h3 className="card-title">
            <PlayCircle size={20} color="var(--primary)" />
            Original Upload
          </h3>
          <VideoPlayer
            src={videoUrl}
            analysis={analysis}
            activeBodyRegion={activeBodyRegion}
          />
        </div>

        <div className="card glass-panel">
          <h3 className="card-title">
            <ClipboardList size={20} color="var(--accent)" />
            Coach&apos;s Summary
          </h3>
          <p className="feedback-text" style={{ fontSize: '1.05rem', lineHeight: '1.65' }}>
            {analysis.summary}
          </p>
          <div style={{
            marginTop: 'auto',
            padding: '0.75rem',
            background: 'rgba(0, 240, 255, 0.04)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 240, 255, 0.15)',
          }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Target size={16} />
              Coaching Focus
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              The coach has prioritized corrective drills based on your movement patterns below.
            </p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="card glass-panel">
          <h3 className="card-title">
            <Star size={20} color="#F59E0B" />
            Strengths
          </h3>
          <div className="strengths-list">
            {analysis.strengths.map((s, idx) => (
              <div key={idx} className="strength-item">
                <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                {s.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 2: Issues + Drills */}
      <div className="dashboard-grid" style={{ marginTop: 0 }}>

        {/* Issues */}
        <div className="card glass-panel">
          <h3 className="card-title">
            <AlertCircle size={20} color="var(--error)" />
            Detected Issues
          </h3>

          {/* Severity legend */}
          <div className="severity-legend">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#EF4444' }} /> 8–10: Fix immediately
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#F59E0B' }} /> 5–7: Work on this
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#10B981' }} /> 1–4: Fine-tuning
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {sortedIssues.map((issue, idx) => {
              const color = severityColor(issue.severity);
              return (
                <div
                  key={idx}
                  className={`feedback-item issue${activeBodyRegion === issue.body_region ? ' issue-card-selected' : ''}`}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', gap: '0.5rem', cursor: 'pointer' }}
                  onClick={() => setActiveBodyRegion(r => r === issue.body_region ? null : issue.body_region)}
                >
                  {activeBodyRegion === issue.body_region && (
                    <span className="issue-highlight-badge">● highlighting on video</span>
                  )}
                  {/* Title + severity */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'white', lineHeight: 1.3 }}>{issue.title}</span>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: `${color}22`,
                      color,
                      border: `1px solid ${color}`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {issue.severity}/10
                    </span>
                  </div>

                  {/* Tags: body region + timestamp */}
                  {(issue.body_region || issue.timestamp_hint) && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {issue.body_region && (
                        <span className="region-tag">
                          <MapPin size={9} style={{ display: 'inline', marginRight: '2px' }} />
                          {issue.body_region.replace(/_/g, ' ')}
                        </span>
                      )}
                      {issue.timestamp_hint && (
                        <span className="timestamp-tag">
                          <Clock size={9} style={{ display: 'inline', marginRight: '2px' }} />
                          {issue.timestamp_hint}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {issue.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.55', margin: 0 }}>
                      {issue.description}
                    </p>
                  )}

                  {/* Severity bar */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${issue.severity * 10}%`,
                      height: '100%',
                      background: color,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              );
            })}
            {sortedIssues.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No major issues detected.</p>
            )}
          </div>
        </div>

        {/* Drills */}
        <div className="card glass-panel">
          <h3 className="card-title">
            <TrendingUp size={20} color="var(--success)" />
            Tailored Drills
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {analysis.improvements && analysis.improvements.map((improvement, idx) => {
              const graphicPath = getDrillGraphic(improvement.title, improvement.advanced_drills);
              const isLast = idx === analysis.improvements.length - 1;
              return (
                <div key={idx} style={{
                  paddingBottom: isLast ? 0 : '1.5rem',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                }}>
                  <h4 style={{ color: 'var(--success)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={16} />
                    {improvement.title}
                  </h4>

                  {/* Issue link */}
                  {improvement.fixes_issue && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Addresses: <em style={{ color: 'var(--error)', fontStyle: 'normal' }}>{improvement.fixes_issue}</em>
                    </p>
                  )}

                  {/* Drills with descriptions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {improvement.advanced_drills && improvement.advanced_drills.map((drill, didx) => {
                      const desc = getDrillDescription(drill);
                      return (
                        <div key={didx} style={{
                          padding: '0.75rem',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '6px',
                          borderLeft: '3px solid var(--success)',
                        }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{drill}</div>
                          {desc && <p className="drill-description">{desc}</p>}
                        </div>
                      );
                    })}
                  </div>

                  {graphicPath && (
                    <img src={graphicPath} alt={improvement.title} className="drill-graphic" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3D Reference Motion Viewer */}
      {motionId && (
        <div className="motion-viewer-section">
          <h3>
            <Activity size={14} />
            Pro Reference Motion ({analysis.motion_type})
          </h3>
          <ErrorBoundary fallback={null}>
            <MotionViewer3D correctMotionId={motionId} />
          </ErrorBoundary>
        </div>
      )}

    </div>
  );
}
