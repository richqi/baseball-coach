'use client';

import { useRef, useState, useEffect } from 'react';

const SPEEDS = [0.25, 0.5, 1];

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setSpeed(1);
  }, [src]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleSpeed = (s) => {
    setSpeed(s);
  };

  if (!src) return null;

  return (
    <div style={{ position: 'relative' }}>
      <video ref={videoRef} src={src} controls className="video-preview" />
      <div className="speed-overlay">
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '2px' }}>
          Speed
        </span>
        {SPEEDS.map(s => (
          <button
            key={s}
            className={`speed-btn${speed === s ? ' active' : ''}`}
            onClick={() => handleSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
