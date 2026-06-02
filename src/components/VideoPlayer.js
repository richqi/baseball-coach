'use client';

import { useRef, useState, useEffect } from 'react';

const SPEEDS = [0.25, 0.5, 1];

export default function VideoPlayer({ src, analysis, activeBodyRegion }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const [speed, setSpeed] = useState(1);
  const [poseActive, setPoseActive] = useState(false);
  const [poseLoading, setPoseLoading] = useState(false);

  useEffect(() => {
    setSpeed(1);
    setPoseActive(false);
  }, [src]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!analysis || !video || !canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [analysis]);

  // Lazy-load MediaPipe on first pose activation
  useEffect(() => {
    if (!poseActive || poseLandmarkerRef.current) return;
    setPoseLoading(true);
    (async () => {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      setPoseLoading(false);
    })();
  }, [poseActive]);

  const handleSpeed = (s) => setSpeed(s);

  const stepFrame = (direction) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = Math.max(0, video.currentTime + direction * (1 / 30));
  };

  if (!src) return null;

  return (
    <div style={{ position: 'relative' }}>
      <video ref={videoRef} src={src} controls className="video-preview" />
      {analysis && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: poseActive ? 'block' : 'none',
          }}
        />
      )}
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
        {analysis && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button className="speed-btn" onClick={() => stepFrame(-1)}>←</button>
            <button className="speed-btn" onClick={() => stepFrame(1)}>→</button>
            <button
              className={`speed-btn${poseActive ? ' active' : ''}`}
              onClick={() => setPoseActive(a => !a)}
              disabled={poseLoading}
              style={{ opacity: poseLoading ? 0.6 : 1 }}
            >
              {poseLoading ? '…' : '⬡ Pose'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
