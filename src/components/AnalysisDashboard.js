'use client';

import { AlertCircle, CheckCircle2, PlayCircle, ClipboardList } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the 3D viewer to avoid SSR issues with Three.js
const MotionViewer3D = dynamic(() => import('./MotionViewer3D'), { 
  ssr: false,
  loading: () => (
    <div className="viewer-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Loading 3D Environment...</p>
    </div>
  )
});

export default function AnalysisDashboard({ videoUrl, analysis }) {
  if (!analysis) return null;

  return (
    <div className="dashboard-grid">
      {/* Left Column: Original Video & Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card glass-panel">
          <h3 className="card-title">
            <PlayCircle size={20} color="var(--primary)" />
            Original Upload
          </h3>
          <video 
            src={videoUrl} 
            controls 
            className="video-preview"
          />
        </div>

        <div className="card glass-panel">
          <h3 className="card-title">
            <ClipboardList size={20} color="var(--accent)" />
            Coach's Summary
          </h3>
          <p className="feedback-text">{analysis.summary}</p>
        </div>
      </div>

      {/* Right Column: 3D Viewer & Feedback */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <MotionViewer3D motionId={analysis.motion_id || 'default'} />
        </div>

        <div className="card glass-panel">
          <h3 className="card-title">
            <AlertCircle size={20} color="var(--error)" />
            Detected Issues
          </h3>
          <ul className="feedback-list">
            {analysis.issues && analysis.issues.map((issue, idx) => (
              <li key={idx} className="feedback-item issue">
                <div className="icon-wrapper">
                  <AlertCircle size={18} />
                </div>
                <span className="feedback-text">{issue}</span>
              </li>
            ))}
            {(!analysis.issues || analysis.issues.length === 0) && (
              <li className="feedback-item">
                <span className="feedback-text" style={{ color: 'var(--text-secondary)' }}>No major issues detected.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="card glass-panel">
          <h3 className="card-title">
            <CheckCircle2 size={20} color="var(--success)" />
            Actionable Improvements
          </h3>
          <ul className="feedback-list">
            {analysis.improvements && analysis.improvements.map((improvement, idx) => (
              <li key={idx} className="feedback-item improvement">
                <div className="icon-wrapper">
                  <CheckCircle2 size={18} />
                </div>
                <span className="feedback-text">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
