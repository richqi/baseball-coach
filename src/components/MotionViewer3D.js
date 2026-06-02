'use client';

// Paste YouTube video IDs here once you have them.
// For a URL like https://www.youtube.com/watch?v=ABC123xyz the ID is "ABC123xyz"
const REFERENCE_VIDEOS = {
  batting:  '',  // slow-motion pro batting swing
  pitching: '',  // slow-motion pro pitching mechanics
};

export default function MotionViewer3D({ correctMotionId }) {
  const motionType = correctMotionId?.startsWith('batting') ? 'batting' : 'pitching';
  const videoId = REFERENCE_VIDEOS[motionType];

  if (!videoId) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        background: 'rgba(19, 26, 42, 0.6)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed rgba(255,255,255,0.15)',
        gap: '0.5rem',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Reference video not configured yet.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', opacity: 0.65 }}>
          Add a YouTube video ID to{' '}
          <code style={{ color: 'var(--primary)', background: 'rgba(0,240,255,0.08)', padding: '0 4px', borderRadius: '3px' }}>
            REFERENCE_VIDEOS.{motionType}
          </code>{' '}
          in <code style={{ color: 'var(--primary)', background: 'rgba(0,240,255,0.08)', padding: '0 4px', borderRadius: '3px' }}>
            src/components/MotionViewer3D.js
          </code>
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={`Pro ${motionType} reference`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
