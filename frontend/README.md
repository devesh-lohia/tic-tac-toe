# 🎨 Tic-Tac-Toe Arena Frontend

A high-performance, responsive React application for the Nakama Tic-Tac-Toe Arena.

## ⚡ Features
- **Modern UI**: Dark-mode aesthetic with glassmorphic components using Tailwind CSS.
- **Real-Time Synergy**: Low-latency WebSocket communication via the Nakama JS SDK.
- **Mobile First**: Fully responsive grid that scales perfectly to any screen size.
- **Local Diagnostics**: Built-in specialized logger accessible via `__nakama` in DevTools.

## 🛠️ Stack
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Deployment**: Vercel

## 📂 Architecture
- **`src/NakamaManager.ts`**: The core singleton managing the auth-to-socket lifecycle.
- **`src/hooks/useNakamaSocket.ts`**: A custom hook for reactive match-state management.
- **`src/components/`**: Atomic component structure (Board, Lobby, MatchView).

## 🚀 Running Locally
1. Install dependencies: `npm install`
2. Configure `.env`:
   ```env
   VITE_NAKAMA_HOST=localhost
   VITE_NAKAMA_PORT=7350
   VITE_NAKAMA_USE_SSL=false
   VITE_NAKAMA_SERVER_KEY=defaultkey
   ```
3. Start dev server: `npm run dev`

## 🏥 Diagnostics
Type `__nakama.downloadLogs()` in the browser console to export a full history of socket events and RPC calls—even in production.
