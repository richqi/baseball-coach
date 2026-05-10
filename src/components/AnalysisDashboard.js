'use client';

import { AlertCircle, CheckCircle2, PlayCircle, ClipboardList, Target, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the 3D viewer to avoid SSR issues with Three.js
const MotionViewer3D = dynamic(() => import('./MotionViewer3D'), { 
  ssr: false,
  loading: () => (
    <div className="viewer-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Loading 3D Environments...</p>
    </div>
  )
});

export default function AnalysisDashboard({ videoUrl, analysis }) {
  if (!analysis) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Top Section: Original Video & Summary */}
      <div className="dashboard-grid">
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
          <p className="feedback-text" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{analysis.summary}</p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} />
                Focus Areas
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Based on your {analysis.flawed_motion_id?.replace('_', ' ')}, the coach has prioritized the following drills.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Issues & Improvements in parallel */}
      <div className="dashboard-grid">
        <div className="card glass-panel">
          <h3 className="card-title">
            <AlertCircle size={20} color="var(--error)" />
            Detected Issues
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analysis.issues && analysis.issues.map((issue, idx) => (
              <div key={idx} className="feedback-item issue" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'white' }}>{issue.title}</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    background: issue.severity > 7 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: issue.severity > 7 ? '#EF4444' : '#F59E0B',
                    border: `1px solid ${issue.severity > 7 ? '#EF4444' : '#F59E0B'}`
                  }}>
                    Severity: {issue.severity}/10
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${issue.severity * 10}%`, height: '100%', background: issue.severity > 7 ? '#EF4444' : '#F59E0B' }}></div>
                </div>
              </div>
            ))}
            {(!analysis.issues || analysis.issues.length === 0) && (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No major issues detected.</p>
            )}
          </div>
        </div>

        <div className="card glass-panel">
          <h3 className="card-title">
            <TrendingUp size={20} color="var(--success)" />
            Tailored Drills
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {analysis.improvements && analysis.improvements.map((improvement, idx) => (
              <div key={idx} style={{ padding: '0 0.5rem' }}>
                <h4 style={{ color: 'var(--success)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} />
                    {improvement.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {improvement.advanced_drills && improvement.advanced_drills.map((drill, didx) => (
                        <div key={didx} style={{ 
                            padding: '0.75rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '6px', 
                            borderLeft: '3px solid var(--success)',
                            fontSize: '0.9rem'
                        }}>
                            {drill}
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: 3D Models */}
      <div className="card glass-panel" style={{ padding: '1rem', overflow: 'hidden' }}>
        <h3 className="card-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1rem' }}>
           3D Motion Comparison (High-Fidelity)
        </h3>
        <MotionViewer3D 
          correctMotionId={analysis.correct_motion_id || 'default'} 
        />
      </div>

    </div>
  );
}
