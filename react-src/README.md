# Campus Match React Source

This folder is the new React source workspace for rebuilding the current static Campus Match site in maintainable components.

The existing production site under `public/` is not replaced by this folder yet. Use this workspace for local previews and gradual migration.

## Commands

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5174
npm run build
npm run lint
```

## Current Scope

- Vite + React app scaffolded.
- Homepage rebuilt as React components in `src/App.jsx`.
- Styling lives in `src/App.css` and `src/index.css`.
- Desktop preview uses the top navigation.
- Mobile preview uses the bottom app-style navigation.

## React Bits Workflow

1. Add the React Bits component under `src/components/`.
2. Keep its CSS next to the component or import it from `src/App.css`.
3. Preview locally on port `5174`.
4. Only migrate into production after the React page is accepted.

## Migration Plan

1. Rebuild homepage.
2. Rebuild login and register flow.
3. Rebuild discovery and match cards.
4. Rebuild profile and avatar editing.
5. Rebuild messages.
6. Swap Netlify publish from `public/` to the React build output when ready.
