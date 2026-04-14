# 🚀 Nakama Tic-Tac-Toe Backend

The server-authoritative engine driving the Tic-Tac-Toe Arena. Built with the **Nakama TypeScript Runtime**.

## 🏗️ Technical Stack
- **Engine**: [Nakama 3.x](https://heroiclabs.com/nakama/)
- **Runtime**: TypeScript (Compiled to JS for execution)
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Docker Container on Railway

## 📂 Key Components
- **`src/main.ts`**: The entry point. Handles Matchmaking logic, RPC registrations, and Leaderboard initialization.
- **Match Handler**: Manages the authoritative game loop:
  - `matchInit`: State initialization.
  - `matchJoin`: Presence management and username resolution.
  - `matchLoop`: **Move validation**, turn management, and win-condition checking.
- **RPCs**:
  - `authenticate_exclusive`: Secure custom authentication wrapper.
  - `create_match_authoritative`: Generates room codes for private sessions.
  - `list_open_matches`: Public lobby discovery.

## 🛠️ Local Development
1. **Compilation**:
   ```bash
   npm run build
   ```
   This compiles the TS source into the `./build` directory which Nakama loads.

2. **Configuration**:
   Modify `local.yml` for server settings or use environment variables in `docker-compose.yml`.

## 🔐 Production Configuration
The backend is hardened for production:
- **CORS**: Strictly enforced origin matching `CORS_ORIGINS`.
- **Identity Persistence**: Manages the mapping between Nakama Users and human-readable Display Names.
- **Port Masking**: Configured to listen on port `8080` to comply with Railway networking requirements.
