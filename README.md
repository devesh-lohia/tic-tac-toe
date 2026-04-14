# ⚔️ Nakama Tic-Tac-Toe Arena

**Production-ready, server-authoritative multiplayer Tic-Tac-Toe built with Nakama and React.**  
*Lila Games Architecture Assignment — Engineering Culture Submission*

[![Live Game](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://tic-tac-toe-devesh.vercel.app/)
[![Backend Status](https://img.shields.io/badge/Nakama%20Backend-Railway-blue?style=for-the-badge&logo=railway)](https://tic-tac-toe-production-2557.up.railway.app)

---

## 🏛️ Architecture & Design Decisions

### **1. Server-Authoritative Logic (Nakama Runtime)**
Unlike traditional Tic-Tac-Toe where the client reports a win, this system implements a **strictly authoritative model**. 
- **Validation**: Every move is sent to the server as a raw index. The server validates if the move is legal, if it's the player's turn, and if the cell is empty.
- **State Source of Truth**: The server maintains the board state in memory. Clients only receive updates; they cannot manipulate the board.
- **Cheating Prevention**: Since the win-check happens on the server, a client cannot simply forge a "Victory" message.

### **2. Matchmaking & Concurrency**
- **Matchmaker**: Uses Nakama's built-in Matchmaker with custom properties to support **Classic** vs **Timed** modes.
- **Authoritative Matches**: Uses Nakama's Go-based `MatchHandler` (via TypeScript) to manage multiple concurrent game sessions in isolation.
- **Room Discovery**: Implemented a custom RPC system to generate and resolve 5-digit room codes, enabling private play with friends.

### **3. Persistence & Leaderboards**
- **Supabase Integration**: Connected Nakama to a managed Supabase PostgreSQL instance using the session pooler for high-performance database connectivity.
- **Global Ranking**: Implemented a persistent Leaderboard system that tracks wins, losses, draws, and points across deployments.

---

## 🚀 Deployed Infrastructure
- **Frontend**: [Vercel](https://tic-tac-toe-devesh.vercel.app/) (React + Vite + Tailwind CSS)
- **Backend**: [Railway](https://tic-tac-toe-production-2557.up.railway.app) (Nakama 3.21.1 Container)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL 15)
- **CI/CD**: GitHub Actions for automated secret synchronization and backend scaling.

---

## 🛠️ Setup & Installation

### **Prerequisites**
- Docker & Docker Compose
- Node.js 18+

### **Local Development**
1. **Clone the Repo**:
   ```bash
   git clone https://github.com/devesh-lohia/tic-tac-toe.git
   cd tic-tac-toe
   ```

2. **Spin up Backend (Docker)**:
   ```bash
   docker-compose up --build
   ```
   *The server will be available at `localhost:7350`. Access the console at `localhost:7351` (admin/password).*

3. **Run Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🧪 Testing Multiplayer
1. Open the [Live Demo](https://tic-tac-toe-devesh.vercel.app/) in two different browser windows or use Incognito mode.
2. Log in with two different usernames (e.g., `Player1` and `Player2`).
3. Both players click **"Find Opponent"** with the same mode (e.g., Timed).
4. The server will pair you instantly and begin an authoritative match.

---

## ⚙️ API & Configuration Details
- **Server Key**: `defaultkey` (Configurable via Environment Variables)
- **CORS Policy**: Configured to strictly allow `https://tic-tac-toe-devesh.vercel.app` in production.
- **Ports**: 
  - `8080`: Backend HTTP/Socket (Railway primary)
  - `7351`: Nakama Console
