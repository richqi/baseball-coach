# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

There is no test suite.

## Environment

Requires a `.env.local` file with:
```
GEMINI_API_KEY=your_key_here
```

## Architecture

Single-page Next.js 16 app (App Router) that lets users upload a batting or pitching video, analyzes it with Google Gemini's multimodal AI, and displays structured coaching feedback.

### Data flow

1. User drops/selects a video in `VideoUploader` → calls `onAnalyze(file, previewUrl)` in `page.js`
2. `page.js` POSTs the file to `/api/analyze`
3. The API route (`src/app/api/analyze/route.js`) saves the video to a temp file, uploads it to Gemini Files API, polls until `state !== 'PROCESSING'`, then calls `gemini-2.5-flash` with a carefully structured prompt
4. Gemini returns a raw JSON object (not markdown-wrapped) that is parsed and returned to the client
5. `page.js` renders `AnalysisDashboard` with the result and saves it to `localStorage` (max 10 entries)

### Gemini response schema

The prompt enforces this exact shape — don't change the API prompt without updating `AnalysisDashboard.js` consumers:

```js
{
  motion_type: "batting" | "pitching",
  player_level_estimate: "beginner" | "intermediate" | "advanced",
  summary: string,
  strengths: [{ title: string }],
  issues: [{
    title: string,
    description: string,
    severity: number,        // 1–10
    body_region: "lower_body" | "upper_body" | "arm_path" | "follow_through",
    timestamp_hint: string
  }],
  improvements: [{
    title: string,
    fixes_issue: string,     // must match an issue.title exactly
    advanced_drills: string[]
  }]
}
```

### Drill system

`AnalysisDashboard.js` maps drill names to visual assets via two keyword-lookup tables:

- `DRILL_GRAPHICS` — maps keyword substrings → image paths under `public/images/drills/`
- `DRILL_DESCRIPTIONS` — maps keyword substrings → coaching instructions shown below each drill

The API prompt explicitly names preferred drills (Fence Drill, Towel Drill, etc.) so that they resolve to graphics. When adding new drill assets, add the image to `public/images/drills/`, then add entries to both tables in `AnalysisDashboard.js`.

### 3D motion viewer

`MotionViewer3D` (react-three-fiber + drei) renders FBX models from `public/models/batting.fbx` and `public/models/pitching.fbx` with their baked animations. It is:
- Dynamically imported with `ssr: false` in `AnalysisDashboard.js` to avoid Three.js SSR errors
- Wrapped in `ErrorBoundary` with `fallback={null}` so a broken WebGL context silently hides the section

### Styling

All styles live in `src/app/globals.css` using CSS custom properties (`--primary`, `--surface`, `--error`, etc.). Components use `className` strings referencing those globals — there are no CSS Modules and no Tailwind utility classes used inside components (though `layout.js` uses a few Tailwind classes on `<html>`/`<body>`).

### Session history

Stored in `localStorage` under the key `baseball_coach_history` as a JSON array capped at 10 entries. Each entry holds `{ id, timestamp, result, videoUrl }` where `videoUrl` is a `blob:` object URL — it does not survive page reloads.
