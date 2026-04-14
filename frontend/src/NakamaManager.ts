import { Client, Session } from "@heroiclabs/nakama-js";
import type { Socket } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";
import log from "./logger";

class NakamaManager {
    private static instance: NakamaManager;
    public client: Client;
    public session: Session | null = null;
    public socket: Socket | null = null;

    // Server configurations
    private readonly SERVER_KEY: string;
    private readonly HOST: string;
    private readonly PORT: string;
    private readonly USE_SSL: boolean;
    private readonly ENVIRONMENT: string;

    private constructor() {
        this.ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || (import.meta.env.DEV ? "development" : "production");
        this.USE_SSL = import.meta.env.VITE_NAKAMA_USE_SSL === "true";
        
        // Strict production validation
        if (this.ENVIRONMENT === "production") {
            this.SERVER_KEY = import.meta.env.VITE_NAKAMA_SERVER_KEY;
            this.HOST = import.meta.env.VITE_NAKAMA_HOST;
            this.PORT = import.meta.env.VITE_NAKAMA_PORT || ""; // Empty port is valid for HTTPS 443
            
            if (!this.SERVER_KEY || !this.HOST) {
                const missing = [];
                if (!this.SERVER_KEY) missing.push("VITE_NAKAMA_SERVER_KEY");
                if (!this.HOST) missing.push("VITE_NAKAMA_HOST");
                throw new Error(`CRITICAL: Missing production environment variables: ${missing.join(", ")}`);
            }
        } else {
            // Local development defaults
            this.SERVER_KEY = import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey";
            this.HOST = import.meta.env.VITE_NAKAMA_HOST || "127.0.0.1";
            this.PORT = import.meta.env.VITE_NAKAMA_PORT || "7350";
        }

        this.client = new Client(this.SERVER_KEY, this.HOST, this.PORT, this.USE_SSL);
        
        log.lifecycle.info("NakamaManager initialized", {
            env: this.ENVIRONMENT,
            host: this.HOST,
            port: this.PORT,
            ssl: this.USE_SSL,
        });
    }

    public static getInstance(): NakamaManager {
        if (!NakamaManager.instance) {
            NakamaManager.instance = new NakamaManager();
        }
        return NakamaManager.instance;
    }

    public async authenticate(username: string): Promise<Session> {
        let browserId = localStorage.getItem("nakama_browser_id");
        if (!browserId) {
            browserId = uuidv4();
            localStorage.setItem("nakama_browser_id", browserId);
            log.auth.debug("Generated new browser_id", { browserId });
        }

        const protocol = this.USE_SSL ? "https" : "http";
        const portSuffix = this.PORT ? `:${this.PORT}` : "";
        
        try {
            const url = `${protocol}://${this.HOST}${portSuffix}/v2/rpc/authenticate_exclusive`;
            const payload = { username, browser_id: browserId };
            const wrappedPayload = JSON.stringify(JSON.stringify(payload));

            log.network.info("→ POST authenticate_exclusive", { url });

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Basic " + btoa(this.SERVER_KEY + ":"),
                },
                body: wrappedPayload,
            });

            if (!response.ok) throw new Error(`Authentication failed: ${response.status}`);

            const rawResponse = await response.json();
            const data = rawResponse.payload ? JSON.parse(rawResponse.payload) : rawResponse;

            if (!data.token) throw new Error("No token returned from server");

            this.session = Session.restore(data.token, ""); 
            log.auth.info("✅ Authenticated successfully", { username: this.session.username });

            await this.createSocket();
            return this.session;
        } catch (error) {
            log.auth.error("❌ Authentication failed", error);
            throw error;
        }
    }

    public async createSocket(): Promise<Socket> {
        if (!this.session) throw new Error("No active session");
        if (this.socket) return this.socket;

        try {
            this.socket = this.client.createSocket(this.client.useSSL, false);
            await this.socket.connect(this.session, true);
            log.socket.info("✅ WebSocket connected");
            return this.socket;
        } catch (error) {
            log.socket.error("❌ WebSocket connection failed", error);
            throw error;
        }
    }

    public async listMatches(): Promise<any> {
        try {
            const result = await this.client.rpc(this.session!, 'list_open_matches', {});
            return (result.payload as any).matches || [];
        } catch (error) {
            log.match.error('❌ Failed to list matches', error);
            throw error;
        }
    }

    public async findMatchByCode(code: string): Promise<string> {
        if (!this.client || !this.session) throw new Error('Not initialized');
        try {
            const result = await this.client.rpc(this.session, 'find_match_by_code', { code });
            return (result.payload as any).match_id;
        } catch (error) {
            log.match.error('❌ Failed to resolve room code', error);
            throw error;
        }
    }

    public async createMatch(visibility: 'public' | 'private', mode: 'timed' | 'classic'): Promise<{ matchId: string, code: string }> {
        if (!this.client || !this.session) throw new Error('Not initialized');
        try {
            const result = await this.client.rpc(this.session, 'create_match_authoritative', { visibility, mode, hostName: this.session.username });
            const payload = result.payload as any;
            log.match.info('✅ Authoritative match created', { code: payload.code });
            return { matchId: payload.match_id, code: payload.code };
        } catch (error) {
            log.match.error('❌ Failed to create match', error);
            throw error;
        }
    }

    public async joinMatch(matchId: string): Promise<any> {
        if (!this.socket) throw new Error("Socket not initialized");
        try {
            const match = await this.socket.joinMatch(matchId);
            log.match.info("✅ Joined match", { matchId });
            return match;
        } catch (error) {
            log.match.error("❌ Failed to join match", error);
            throw error;
        }
    }

    public async addMatchmaker(
        query: string = "*",
        minCount: number = 2,
        maxCount: number = 2,
        stringProperties?: Record<string, string>,
        numericProperties?: Record<string, number>
    ): Promise<any> {
        if (!this.socket) throw new Error("Socket not initialized");
        try {
            const ticket = await this.socket.addMatchmaker(query, minCount, maxCount, stringProperties, numericProperties);
            log.matchmaker.info("✅ Matchmaker ticket received");
            return ticket;
        } catch (error) {
            log.matchmaker.error("❌ Failed to add to matchmaker", error);
            throw error;
        }
    }

    public async removeMatchmaker(ticket: string): Promise<void> {
        if (!this.socket) throw new Error("Socket not initialized");
        try {
            await this.socket.removeMatchmaker(ticket);
            log.matchmaker.info("✅ Matchmaker ticket cancelled");
        } catch (error) {
            log.matchmaker.error("❌ Failed to remove matchmaker ticket", error);
            throw error;
        }
    }

    public async sendMatchMove(matchId: string, index: number): Promise<void> {
        if (!this.socket) throw new Error('Socket not initialized');
        const OpCode_MOVE = 2;
        const encoded = new TextEncoder().encode(JSON.stringify({ index }));
        try {
            await this.socket.sendMatchState(matchId, OpCode_MOVE, encoded);
        } catch (error) {
            log.board.error('❌ Failed to send move', error);
            throw error;
        }
    }

    public async sendReadyStatus(matchId: string, ready: boolean): Promise<void> {
        if (!this.socket) throw new Error('Socket not initialized');
        try {
            const encoded = new TextEncoder().encode(JSON.stringify({ ready }));
            await this.socket.sendMatchState(matchId, 6, encoded);
        } catch (error) {
            log.match.error('❌ Failed to send ready status', error);
            throw error;
        }
    }

    public async listLeaderboard(limit: number = 10): Promise<any> {
        if (!this.client || !this.session) throw new Error('Not initialized');
        try {
            const result = await this.client.listLeaderboardRecords(this.session, 'tictactoe_global', undefined, limit);
            return result.records || [];
        } catch (error) {
            log.match.error('❌ Failed to list leaderboard records', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.socket) {
            try { this.socket.disconnect(false); } catch (e) {}
            this.socket = null;
        }
        this.session = null;
        log.lifecycle.info('NakamaManager state cleared');
    }
}

const instance = NakamaManager.getInstance();
export default instance;
