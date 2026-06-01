# Slow-Motion Video Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 0.25×/0.5×/1× playback speed controls as a frosted glass overlay on the "Original Upload" video card in the analysis dashboard.

**Architecture:** Extract a `VideoPlayer` component that owns the `<video>` element, speed state, and overlay UI. `AnalysisDashboard` replaces its inline `<video>` tag with `<VideoPlayer src={videoUrl} />`. Speed buttons set `videoRef.current.playbackRate` imperatively on click; a `useEffect` resets speed to 1× when `src` changes (e.g. history navigation).

**Tech Stack:** React 19, Next.js 16 App Router, plain CSS custom properties (no Tailwind in components)

---

### Task 1: Fix line-ending warnings

**Files:**
- Create: `.gitattributes`

- [ ] **Step 1: Create `.gitattributes` at the repo root**

```
* text=auto eol=lf
*.bat text eol=crlf
```

- [ ] **Step 2: Commit**

```bash
git add .gitattributes
git commit -m "chore: normalize line endings to LF"
```

---

### Task 2: Add speed-control CSS classes to `globals.css`

**Files:**
- Modify: `src/app/globals.css` (append after existing rules)

- [ ] **Step 1: Append the following three rule-sets to the end of `src/app/globals.css`**

```css
/* Speed overlay — sits above native video controls */
.speed-overlay {
  position: absolute;
  bottom: 52px;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.speed-btn {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.speed-btn.active {
  background: rgba(0, 240, 255, 0.18);
  color: var(--primary);
  border-color: rgba(0, 240, 255, 0.5);
  font-weight: 700;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add speed overlay CSS classes"
```

---

### Task 3: Create `VideoPlayer` component

**Files:**
- Create: `src/components/VideoPlayer.js`

- [ ] **Step 1: Create `src/components/VideoPlayer.js` with the following content**

```jsx
'use client';

import { useRef, useState, useEffect } from 'react';

const SPEEDS = [0.25, 0.5, 1];

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setSpeed(1);
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
  }, [src]);

  const handleSpeed = (s) => {
    setSpeed(s);
    if (videoRef.current) {
      videoRef.current.playbackRate = s;
    }
  };

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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VideoPlayer.js
git commit -m "feat: add VideoPlayer component with slow-motion controls"
```

---

### Task 4: Wire `VideoPlayer` into `AnalysisDashboard`

**Files:**
- Modify: `src/components/AnalysisDashboard.js`

- [ ] **Step 1: Add the `VideoPlayer` import at the top of `src/components/AnalysisDashboard.js`, after the existing imports**

Current imports block ends around line 8. Add:
```jsx
import VideoPlayer from './VideoPlayer';
```

- [ ] **Step 2: Replace the `<video>` element at line 134**

Replace:
```jsx
<video src={videoUrl} controls className="video-preview" />
```

With:
```jsx
<VideoPlayer src={videoUrl} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AnalysisDashboard.js
git commit -m "feat: use VideoPlayer in AnalysisDashboard for slow-motion support"
```

---

### Task 5: Verify in the browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000`.

- [ ] **Step 2: Upload a short video clip and wait for analysis to complete**

After analysis, the "Original Upload" card should show the video with a frosted overlay bar above the native controls containing **Speed 0.25× 0.5× 1×**.

- [ ] **Step 3: Verify speed controls work**

- Click **0.25×** — video plays at quarter speed; button turns cyan
- Click **0.5×** — video plays at half speed; button turns cyan
- Click **1×** — video returns to normal speed; button turns cyan
- Native controls (pause, seek, fullscreen) still function with any speed active

- [ ] **Step 4: Verify speed resets on history navigation**

Open a previous session from History, select an entry. The speed overlay should default back to **1×** (not carry over the previous speed).

- [ ] **Step 5: Push**

```bash
git push
```
