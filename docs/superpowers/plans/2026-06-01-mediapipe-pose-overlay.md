# MediaPipe Pose Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-activated MediaPipe skeleton overlay to the video in `AnalysisDashboard`, with frame step buttons and body-region highlighting linked to Gemini's issue analysis.

**Architecture:** `VideoPlayer.js` gains two new props (`analysis`, `activeBodyRegion`) and hosts all pose logic — canvas overlay, MediaPipe lazy-loading, RAF inference loop, frame stepping. `AnalysisDashboard.js` adds `activeBodyRegion` state and makes issue cards clickable to set it.

**Tech Stack:** React 19, Next.js 16 App Router, `@mediapipe/tasks-vision` (npm), HTML Canvas 2D API, `ResizeObserver`

---

## File Map

| File | Change |
|------|--------|
| `package.json` | Add `@mediapipe/tasks-vision` |
| `src/app/globals.css` | Add `.issue-card-selected`, `.issue-highlight-badge` |
| `src/components/AnalysisDashboard.js` | Add `activeBodyRegion` state + issue card click + pass props to VideoPlayer |
| `src/components/VideoPlayer.js` | Add pose toggle, canvas, MediaPipe loop, frame step, REGION_LANDMARKS, drawSkeleton |

---

### Task 1: Install @mediapipe/tasks-vision

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

Run in `d:\Code\baseball-coach`:
```bash
npm install @mediapipe/tasks-vision
```

Expected: package added to `dependencies` in `package.json`. No errors.

- [ ] **Step 2: Verify the install**

```bash
node -e "require('@mediapipe/tasks-vision'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @mediapipe/tasks-vision dependency"
```

---

### Task 2: Add CSS for issue card selection

**Files:**
- Modify: `src/app/globals.css` (append after last line)

- [ ] **Step 1: Append to the end of `src/app/globals.css`**

```css
/* Selected issue card — full border replaces left-edge border */
.issue-card-selected {
  border: 1px solid var(--error) !important;
  background: rgba(239, 68, 68, 0.06);
}

/* Small badge shown inside selected issue card */
.issue-highlight-badge {
  font-size: 0.65rem;
  color: var(--error);
  opacity: 0.85;
  margin-top: 0.25rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add issue card selected state CSS"
```

---

### Task 3: Make issue cards selectable in AnalysisDashboard

**Files:**
- Modify: `src/components/AnalysisDashboard.js`

**Context:** `AnalysisDashboard.js` currently has no `useState`. The component starts with `'use client'` at line 1. Import section has `import dynamic from 'next/dynamic'` and lucide-react imports but no React hook imports.

- [ ] **Step 1: Add `useState` import**

At the top of `src/components/AnalysisDashboard.js`, add after the `'use client'` line:

```js
import { useState } from 'react';
```

- [ ] **Step 2: Add `activeBodyRegion` state inside the component**

In `AnalysisDashboard`, after line `if (!analysis) return null;`, add:

```js
const [activeBodyRegion, setActiveBodyRegion] = useState(null);
```

- [ ] **Step 3: Pass new props to VideoPlayer (line ~135)**

Replace:
```jsx
<VideoPlayer src={videoUrl} />
```

With:
```jsx
<VideoPlayer
  src={videoUrl}
  analysis={analysis}
  activeBodyRegion={activeBodyRegion}
/>
```

- [ ] **Step 4: Make issue cards clickable**

Find the issue card `<div>` at line ~209:
```jsx
<div key={idx} className="feedback-item issue" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', gap: '0.5rem' }}>
```

Replace with:
```jsx
<div
  key={idx}
  className={`feedback-item issue${activeBodyRegion === issue.body_region ? ' issue-card-selected' : ''}`}
  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', gap: '0.5rem', cursor: 'pointer' }}
  onClick={() => setActiveBodyRegion(r => r === issue.body_region ? null : issue.body_region)}
>
```

- [ ] **Step 5: Add highlighting badge inside issue card**

Directly after the opening `<div>` from Step 4 (before the `{/* Title + severity */}` comment), add:

```jsx
{activeBodyRegion === issue.body_region && (
  <span className="issue-highlight-badge">● highlighting on video</span>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/AnalysisDashboard.js
git commit -m "feat: make issue cards selectable for pose highlighting"
```

---

### Task 4: Add frame step buttons to VideoPlayer

**Files:**
- Modify: `src/components/VideoPlayer.js`

**Context:** VideoPlayer currently accepts only `{ src }`. It renders a wrapper div with `position: relative`, a `<video>` element, and a `.speed-overlay` div. The full file is 46 lines.

- [ ] **Step 1: Replace the entire content of `src/components/VideoPlayer.js`**

```jsx
'use client';

import { useRef, useState, useEffect } from 'react';

const SPEEDS = [0.25, 0.5, 1];

export default function VideoPlayer({ src, analysis, activeBodyRegion }) {
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
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Start dev server and verify frame step buttons appear**

```bash
npm run dev
```

Open `http://localhost:3000`. Load a history entry (or run an analysis). The "Original Upload" card should show:
```
[ SPEED  0.25×  0.5×  1×    ←  → ]
```
Click ← and → — the video should pause and seek backward/forward.

- [ ] **Step 3: Commit**

```bash
git add src/components/VideoPlayer.js
git commit -m "feat: add frame step buttons to VideoPlayer"
```

---

### Task 5: Add pose toggle and canvas to VideoPlayer

**Files:**
- Modify: `src/components/VideoPlayer.js`

- [ ] **Step 1: Replace the entire content of `src/components/VideoPlayer.js`**

```jsx
'use client';

import { useRef, useState, useEffect } from 'react';

const SPEEDS = [0.25, 0.5, 1];

export default function VideoPlayer({ src, analysis, activeBodyRegion }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [speed, setSpeed] = useState(1);
  const [poseActive, setPoseActive] = useState(false);

  useEffect(() => {
    setSpeed(1);
    setPoseActive(false);
  }, [src]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Keep canvas dimensions in sync with video element size
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
            >
              ⬡ Pose
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the Pose button appears**

With the dev server running, load an analysis result. The overlay bar should now show:
```
[ SPEED  0.25×  0.5×  1×    ←  →  ⬡ Pose ]
```
Clicking "Pose" should highlight it cyan. The canvas exists in the DOM but is hidden (nothing draws to it yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/VideoPlayer.js
git commit -m "feat: add pose toggle and canvas overlay to VideoPlayer"
```

---

### Task 6: Add MediaPipe lazy loading to VideoPlayer

**Files:**
- Modify: `src/components/VideoPlayer.js`

- [ ] **Step 1: Replace the entire content of `src/components/VideoPlayer.js`**

```jsx
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
```

- [ ] **Step 2: Verify MediaPipe loads without errors**

With the dev server running, load an analysis result and click "Pose". The button should briefly show `…` (loading) then switch to `⬡ Pose` highlighted cyan. Open browser DevTools → Network tab and confirm the WASM and model files are fetched (~8MB total, first time only).

No errors should appear in the console.

- [ ] **Step 3: Commit**

```bash
git add src/components/VideoPlayer.js
git commit -m "feat: lazy-load MediaPipe PoseLandmarker on first pose activation"
```

---

### Task 7: Add inference loop and skeleton drawing

**Files:**
- Modify: `src/components/VideoPlayer.js`

- [ ] **Step 1: Replace the entire content of `src/components/VideoPlayer.js` with the final version**

```jsx
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

  // Keep activeBodyRegion accessible in RAF loop without stale closures
  useEffect(() => {
    activeBodyRegionRef.current = activeBodyRegion;
    // If paused with pose active, redraw immediately with new highlight
    if (poseActive && videoRef.current?.paused && poseLandmarkerRef.current && canvasRef.current) {
      const results = poseLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
      drawSkeleton(canvasRef.current, results, activeBodyRegion);
    }
  }, [activeBodyRegion, poseActive]);

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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VideoPlayer.js
git commit -m "feat: add MediaPipe inference loop and skeleton drawing to VideoPlayer"
```

---

### Task 8: Browser verification

**Files:** none

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000`.

- [ ] **Step 2: Load an analysis result**

Upload a short batting or pitching clip and wait for analysis. Or open History and select a previous session with a real video (blob URL must still be valid in the current session — run a fresh analysis if history URLs are stale).

- [ ] **Step 3: Verify Pose toggle loads MediaPipe**

Click `⬡ Pose`. The button should briefly show `…`, then turn cyan. The canvas element becomes visible over the video. Open DevTools → Console — no errors expected.

- [ ] **Step 4: Verify skeleton renders while playing**

Press play on the video (at 0.25× speed for best results). A skeleton of white/grey lines and dots should track the player's body in real time.

- [ ] **Step 5: Verify frame stepping with skeleton**

Pause the video. Click `→` — the video should advance one frame and the skeleton should update to the new pose. Click `←` — steps backward. The skeleton should follow each seek.

- [ ] **Step 6: Verify issue highlighting**

In the "Detected Issues" panel, click an issue card. The card border should turn red and show `● highlighting on video`. On the skeleton, the joints for that body region (e.g. hips/knees/ankles for `lower_body`) should turn red and appear larger. Clicking the same card again clears the highlight.

- [ ] **Step 7: Verify toggling pose off clears canvas**

Click `⬡ Pose` again to deactivate. The canvas should disappear and the skeleton clears. Native video controls remain fully functional.

- [ ] **Step 8: Push**

```bash
git push
```
