# MediaPipe Pose Overlay with Frame-by-Frame Stepping

## Overview

Add a user-activated pose skeleton overlay to the "Original Upload" video card in `AnalysisDashboard`. When enabled, MediaPipe Pose runs client-side in the browser and draws a real-time skeleton over the video. Body regions flagged by Gemini's analysis highlight red when the user clicks an issue card. Frame step buttons (← →) let the user advance one frame at a time while the skeleton updates.

## Scope

- **In scope:** Pose overlay + frame stepping + issue highlighting in the `AnalysisDashboard` "Original Upload" card only
- **Out of scope:** VideoUploader preview, AnalysisHistory thumbnails, joint angle labels, pitch/batting-specific landmark sets beyond the four body regions

---

## Architecture

### `VideoPlayer.js` — extended with two new props

| Prop | Type | Description |
|------|------|-------------|
| `analysis` | object \| undefined | Full Gemini result. When present, renders the "Pose" toggle button. |
| `activeBodyRegion` | string \| null | One of `lower_body`, `upper_body`, `arm_path`, `follow_through`. Matching landmarks highlight red. |

All pose logic lives inside `VideoPlayer.js`. No ref forwarding, no new component files for pose.

### `AnalysisDashboard.js` — minimal additions

- New state: `activeBodyRegion` (string | null, default null)
- Issue cards gain `onClick` toggle: `setActiveBodyRegion(r => r === issue.body_region ? null : issue.body_region)`
- Selected card: full `var(--error)` border + small `● highlighting` badge (instead of left-edge border only)
- `<VideoPlayer>` call gains `analysis={analysis}` and `activeBodyRegion={activeBodyRegion}` props

---

## VideoPlayer Pose Mode

### State and refs added

```js
const canvasRef = useRef(null);
const poseLandmarkerRef = useRef(null);  // MediaPipe instance
const rafRef = useRef(null);             // requestAnimationFrame ID
const [poseActive, setPoseActive] = useState(false);
```

### "Show Pose" toggle

Rendered in the overlay bar when `analysis` prop is present, on the right side after the speed buttons and frame step buttons:

```
[ SPEED  0.25×  0.5×  1×      ←  →   ⬡ Pose ]
```

- Frame step buttons (← →) are always rendered when `analysis` is present (not only in pose mode) — they work independently of the skeleton
- "Pose" button: inactive when off, cyan highlight when active (matches `.speed-btn.active` style)

### Canvas element

```jsx
{analysis && (
  <canvas
    ref={canvasRef}
    style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      display: poseActive ? 'block' : 'none',
    }}
  />
)}
```

`pointerEvents: none` ensures the canvas never intercepts clicks on the video or native controls.

Canvas dimensions are kept in sync with the video via a `ResizeObserver` on the video element.

---

## MediaPipe Integration

### Library

```
npm install @mediapipe/tasks-vision
```

### Lazy loading

`PoseLandmarker` is created the first time the user activates pose mode (not on component mount). Subsequent toggles reuse the cached instance in `poseLandmarkerRef.current`.

```js
const loadPoseLandmarker = async () => {
  if (poseLandmarkerRef.current) return;
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
};
```

The lite model (~8MB) and WASM runtime are fetched from CDN on first activation and cached by the browser. `delegate: 'GPU'` falls back to CPU automatically if WebGL is unavailable.

### Inference loop

```js
const runLoop = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (!video || !canvas || video.paused || video.ended) return;

  const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());
  drawSkeleton(canvas, results, activeBodyRegionRef.current);
  rafRef.current = requestAnimationFrame(runLoop);
};
```

`activeBodyRegionRef` is a ref kept in sync with the `activeBodyRegion` prop so the RAF loop always reads the current value without stale closure issues.

The loop starts on `video.play` event and stops on `video.pause`, `video.ended`, or pose mode toggle off.

### Frame stepping

```js
const stepFrame = (direction) => {
  const video = videoRef.current;
  video.pause();
  video.currentTime = Math.max(0, video.currentTime + direction * (1 / 30));
  video.addEventListener('seeked', () => {
    if (!poseActive || !poseLandmarkerRef.current) return;
    // Still use detectForVideo (VIDEO mode) — provide a fresh timestamp
    const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());
    drawSkeleton(canvasRef.current, results, activeBodyRegionRef.current);
  }, { once: true });
};
```

`detectForVideo` is used for both the live loop and frame steps — no mode-switching required. Frame steps only draw the skeleton when `poseActive` is true.

### `activeBodyRegionRef` sync

```js
const activeBodyRegionRef = useRef(activeBodyRegion);
useEffect(() => { activeBodyRegionRef.current = activeBodyRegion; }, [activeBodyRegion]);
```

This keeps the RAF loop reading the latest prop without stale closures.

---

## Canvas Drawing

### Body region → landmark indices

```js
const REGION_LANDMARKS = {
  lower_body:    [23, 24, 25, 26, 27, 28],  // hips, knees, ankles
  upper_body:    [0, 11, 12, 23, 24],        // nose, shoulders, hips
  arm_path:      [11, 12, 13, 14, 15, 16],   // shoulders, elbows, wrists
  follow_through:[13, 14, 15, 16],           // elbows, wrists
};
```

### Drawing logic

```
Base skeleton:
  connections  → rgba(255, 255, 255, 0.35), stroke-width 2
  landmark dots → rgba(255, 255, 255, 0.55), radius 4

Highlighted region (activeBodyRegion set):
  matching connections  → #EF4444, stroke-width 3
  matching landmark dots → #EF4444, radius 6
```

MediaPipe provides normalized coordinates (0–1). Scale to canvas pixel dimensions before drawing.

---

## CSS Additions (`globals.css`)

```css
/* Pose toggle button — same base as .speed-btn, uses .speed-btn.active when on */
/* No new class needed — reuse .speed-btn and .speed-btn.active */

/* Selected issue card */
.issue-card-selected {
  border: 1px solid var(--error) !important;
  background: rgba(239, 68, 68, 0.06);
}

.issue-highlight-badge {
  font-size: 0.65rem;
  color: var(--error);
  opacity: 0.85;
  margin-top: 0.25rem;
}
```

The pose toggle button reuses `.speed-btn` / `.speed-btn.active` — no new CSS class needed for it.

---

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `@mediapipe/tasks-vision` |
| `src/components/VideoPlayer.js` | Add pose toggle, canvas, MediaPipe loop, frame step buttons, `REGION_LANDMARKS`, `drawSkeleton`, `activeBodyRegionRef` sync |
| `src/components/AnalysisDashboard.js` | Add `activeBodyRegion` state, make issue cards clickable with `.issue-card-selected`, pass `analysis` and `activeBodyRegion` to VideoPlayer |
| `src/app/globals.css` | Add `.issue-card-selected` and `.issue-highlight-badge` |
