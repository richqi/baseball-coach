'use client';

import { useRef, useState, useEffect } from 'react';

const SPEEDS = [0.25, 0.5, 1];

const REGION_LANDMARKS = {
  lower_body:    [23, 24, 25, 26, 27, 28],
  upper_body:    [0, 11, 12, 23, 24],
  arm_path:      [11, 12, 13, 14, 15, 16],
  follow_through:[13, 14, 15, 16],
};

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

function drawSkeleton(canvas, results, activeBodyRegion) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!results?.landmarks?.[0]) return;
  const landmarks = results.landmarks[0];
  const highlighted = activeBodyRegion ? new Set(REGION_LANDMARKS[activeBodyRegion]) : new Set();
  const toPixel = (lm) => ({ x: lm.x * canvas.width, y: lm.y * canvas.height });

  for (const [a, b] of POSE_CONNECTIONS) {
    const pA = toPixel(landmarks[a]);
    const pB = toPixel(landmarks[b]);
    const lit = highlighted.has(a) && highlighted.has(b);
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.strokeStyle = lit ? '#EF4444' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = lit ? 3 : 2;
    ctx.stroke();
  }

  for (let i = 0; i < landmarks.length; i++) {
    const p = toPixel(landmarks[i]);
    const lit = highlighted.has(i);
    ctx.beginPath();
    ctx.arc(p.x, p.y, lit ? 6 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = lit ? '#EF4444' : 'rgba(255,255,255,0.55)';
    ctx.fill();
  }
}

export default function VideoPlayer({ src, analysis, activeBodyRegion }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const activeBodyRegionRef = useRef(activeBodyRegion);
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

  // Sync activeBodyRegion prop into a ref for the RAF loop, and redraw if paused
  useEffect(() => {
    activeBodyRegionRef.current = activeBodyRegion;
    if (poseActive && videoRef.current?.paused && poseLandmarkerRef.current && canvasRef.current) {
      const results = poseLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
      drawSkeleton(canvasRef.current, results, activeBodyRegion);
    }
  }, [activeBodyRegion, poseActive]);

  // Lazy-load MediaPipe on first pose activation
  useEffect(() => {
    if (!poseActive || poseLandmarkerRef.current) return;
    let cancelled = false;
    setPoseLoading(true);
    (async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        if (cancelled) return;
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
      } catch (err) {
        console.error('MediaPipe load failed:', err);
        if (!cancelled) setPoseActive(false);
      } finally {
        if (!cancelled) setPoseLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [poseActive]);

  // RAF inference loop — starts/stops with poseActive and video play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !poseActive) {
      cancelAnimationFrame(rafRef.current);
      if (canvasRef.current) {
        canvasRef.current.getContext('2d').clearRect(
          0, 0, canvasRef.current.width, canvasRef.current.height
        );
      }
      return;
    }

    const loop = () => {
      if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return;
      if (videoRef.current.paused || videoRef.current.ended) return;
      const results = poseLandmarkerRef.current.detectForVideo(
        videoRef.current, performance.now()
      );
      drawSkeleton(canvasRef.current, results, activeBodyRegionRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };

    const handlePlay = () => { rafRef.current = requestAnimationFrame(loop); };
    const handlePause = () => cancelAnimationFrame(rafRef.current);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handlePause);

    if (!video.paused) handlePlay();

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handlePause);
    };
  }, [poseActive]);

  const handleSpeed = (s) => setSpeed(s);

  const stepFrame = (direction) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = Math.max(0, video.currentTime + direction * (1 / 30));
    video.addEventListener('seeked', () => {
      if (!poseActive || !poseLandmarkerRef.current || !canvasRef.current) return;
      const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());
      drawSkeleton(canvasRef.current, results, activeBodyRegionRef.current);
    }, { once: true });
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
