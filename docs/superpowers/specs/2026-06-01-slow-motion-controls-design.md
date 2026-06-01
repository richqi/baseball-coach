# Slow-Motion Video Controls

## Overview

Add playback speed controls to the post-analysis video in `AnalysisDashboard`. The controls appear as a frosted glass overlay bar sitting above the native browser controls at the bottom of the video frame.

## Scope

- **In scope:** Speed controls on the "Original Upload" video card in `AnalysisDashboard`
- **Out of scope:** `VideoUploader` preview, `AnalysisHistory` thumbnails, frame-by-frame stepping (deferred to MediaPipe integration)

## New Component: `VideoPlayer`

**File:** `src/components/VideoPlayer.js`

**Props:**
- `src` (string) — video URL passed from `AnalysisDashboard`

**Internal state:**
- `speed` (number, default `1`) — current playback rate

**Ref:**
- `videoRef` — attached to the `<video>` element; used to set `playbackRate` imperatively on button click

**Speed presets:** `[0.25, 0.5, 1]`

**Behaviour:**
- Clicking a speed button immediately sets `videoRef.current.playbackRate = speed` and updates `speed` state
- A `useEffect` on `src` resets `speed` to `1` and restores `videoRef.current.playbackRate = 1` when the video source changes (history navigation)
- The `<video>` retains native `controls` so pause, seek, and fullscreen remain available

## Overlay UI

`VideoPlayer` renders a wrapper `div` with `position: relative` that contains both the `<video className="video-preview">` and the overlay. The overlay is a `div` absolutely positioned at `bottom: 52px` (above the native controls bar, which sits ~44px tall) spanning the full video width:

```
[ Speed  0.25×  0.5×  1× ]
```

- Active button: `--primary` (#00F0FF) background tint + border + bold weight
- Inactive buttons: muted glass (white 6% opacity background, white 15% border, `--text-secondary` label)
- Frosted background: `rgba(0,0,0,0.55)` + `backdrop-filter: blur(6px)`
- Top border: `1px solid rgba(255,255,255,0.08)` separating it from the video frame

## CSS

Two new classes added to `globals.css`:

```css
.speed-overlay {
  position: absolute;
  bottom: 52px;
  left: 0; right: 0;
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
}

.speed-btn.active {
  background: rgba(0, 240, 255, 0.18);
  color: var(--primary);
  border-color: rgba(0, 240, 255, 0.5);
  font-weight: 700;
}
```

## Integration

In `AnalysisDashboard.js`, the existing:
```jsx
<video src={videoUrl} controls className="video-preview" />
```
is replaced with:
```jsx
<VideoPlayer src={videoUrl} />
```

The `video-preview` CSS class moves inside `VideoPlayer`. No other changes to `AnalysisDashboard`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/VideoPlayer.js` | New file |
| `src/components/AnalysisDashboard.js` | Replace `<video>` with `<VideoPlayer src={videoUrl} />` |
| `src/app/globals.css` | Add `.speed-overlay`, `.speed-btn`, `.speed-btn.active` |
