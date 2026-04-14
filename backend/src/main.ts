/// <reference path="../node_modules/nakama-common/index.d.ts" />

/**
 * TIC-TAC-TOE AUTHORITATIVE BACKEND
 * Cleaned, non-redundant version.
 */

// --- TYPES & CONSTANTS ---

const OpCode = {
    START: 1,
    MOVE: 2,
    UPDATE: 3,
    END: 4,
    PRESENCE: 5,
    READY: 6
};

interface State {
    board: (string | null)[];
    presences: { [userId: string]: nkruntime.Presence };
    marks: { [userId: string]: string }; 
    turn: string | null; 
    winner: string | null; 
    mode: string;
    deadline: number;
    visibility: 'public' | 'private';
    readyPlayers: { [userId: string]: boolean };
    matchStarted: boolean;
    code: string;
    usernames: { [userId: string]: string };
    hostName: string;
    isRanked: boolean;
}

interface PlayerStats {
    wins: number;
    losses: number;
    draws: number;
    points: number;
    username: string; 
}

// --- UTILITIES ---

function checkWin(board: (string | null)[]): boolean {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => board[w[0]] && board[w[0]] === board[w[1]] && board[w[0]] === board[w[2]]);
}

function updatePlayerStats(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, friendlyUsername: string, outcome: 'win' | 'loss' | 'draw', isRanked: boolean) {
    const collection = 'stats';
    const key = 'tictactoe';
    
    // DEFENSIVE: Ensure we don't snapshot a raw UUID as a username
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let nameToStore = friendlyUsername;
    if (uuidRegex.test(nameToStore)) {
        nameToStore = "Champion"; // Fallback if somehow a UUID leaked
    }

    let stats: PlayerStats = { wins: 0, losses: 0, draws: 0, points: 0, username: nameToStore };
    
    try {
        const objects = nk.storageRead([{ collection, key, userId }]);
        if (objects.length > 0) {
            stats = objects[0].value as PlayerStats;
            stats.username = nameToStore;
        }
    } catch (e) { logger.error("Read stat fail: %v", e); }

    if (outcome === 'win') { stats.wins++; stats.points += 3; }
    else if (outcome === 'loss') { stats.losses++; }
    else { stats.draws++; stats.points += 1; }

    try {
        nk.storageWrite([{ collection, key, userId, value: stats, permissionRead: 2, permissionWrite: 0 }]);
        if (isRanked) {
            // EXPLICIT METADATA to ensure it shows up in JSON
            const metadata = {
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws,
                points: stats.points,
                username: nameToStore 
            };
            nk.leaderboardRecordWrite('tictactoe_global', userId, nameToStore, stats.points, 0, metadata);
        }
    } catch (e) { logger.error("Write stat fail: %v", e); }
}

// --- MATCH HANDLER ---

const matchInit: nkruntime.MatchInitFunction<State> = (ctx, logger, nk, params) => {
    const visibility = (params.visibility === 'private') ? 'private' : 'public';
    const state: State = {
        board: Array(9).fill(null),
        presences: {},
        marks: {},
        turn: null,
        winner: null,
        mode: params.mode || "timed",
        deadline: 0,
        visibility: visibility,
        readyPlayers: {},
        matchStarted: false,
        code: params.code || "00000",
        usernames: {},
        hostName: params.hostName || 'Player',
        isRanked: !!params.isRanked
    };

    return { state, tickRate: 10, label: JSON.stringify({ mode: state.mode, visibility: state.visibility, size: 0, code: state.code, hostName: state.hostName }) };
};

const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction<State> = (ctx, logger, nk, dispatcher, tick, state, presence, metadata) => {
    const isFull = Object.keys(state.presences).length >= 2;
    return { state, accept: !isFull, rejectMessage: isFull ? "Match is full" : undefined };
};

const matchJoin: nkruntime.MatchJoinFunction<State> = (ctx, logger, nk, dispatcher, tick, state, presences) => {
    presences.forEach(p => {
        state.presences[p.userId] = p;
        
        try {
            const accounts = nk.accountsGetId([p.userId]);
            if (accounts && accounts.length > 0) {
                // Priority: Display Name -> Username Part -> Fallback
                state.usernames[p.userId] = (accounts[0].user.displayName || accounts[0].user.username.split('.')[0] || 'Player');
            } else {
                state.usernames[p.userId] = p.username.split('.')[0] || 'Player';
            }
        } catch (e) {
            state.usernames[p.userId] = p.username.split('.')[0] || 'Player';
        }
        
        state.readyPlayers[p.userId] = false; 
    });

    dispatcher.matchLabelUpdate(JSON.stringify({ mode: state.mode, visibility: state.visibility, size: Object.keys(state.presences).length, code: state.code, hostName: state.hostName }));
    dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify({ board: state.board, turn: state.turn, readyPlayers: state.readyPlayers, matchStarted: state.matchStarted, usernames: state.usernames }));
    return { state };
};

const matchLeave: nkruntime.MatchLeaveFunction<State> = (ctx, logger, nk, dispatcher, tick, state, presences) => {
    const oldUsernames = { ...state.usernames };

    presences.forEach(p => {
        delete state.presences[p.userId];
        delete state.readyPlayers[p.userId];
    });

    if (!state.matchStarted) Object.keys(state.readyPlayers).forEach(uid => state.readyPlayers[uid] = false);

    dispatcher.matchLabelUpdate(JSON.stringify({ mode: state.mode, visibility: state.visibility, size: Object.keys(state.presences).length, code: state.code }));

    if (Object.keys(state.presences).length < 2 && !state.winner && state.matchStarted) {
        const remainingIds = Object.keys(state.presences);
        if (remainingIds.length === 1) {
            state.winner = remainingIds[0];
            updatePlayerStats(nk, logger, state.winner, state.usernames[state.winner] || "Player", 'win', state.isRanked);
            presences.forEach(p => updatePlayerStats(nk, logger, p.userId, oldUsernames[p.userId] || "Player", 'loss', state.isRanked));
        } else {
            state.winner = "draw";
            presences.forEach(p => updatePlayerStats(nk, logger, p.userId, oldUsernames[p.userId] || "Player", 'draw', state.isRanked));
        }
        dispatcher.broadcastMessage(OpCode.END, JSON.stringify({ winner: state.winner, reason: "Player disconnected" }));
        return null; 
    }

    if (Object.keys(state.presences).length === 0) return null;

    dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify({ readyPlayers: state.readyPlayers, matchStarted: state.matchStarted, usernames: state.usernames }));
    return { state };
};

const matchLoop: nkruntime.MatchLoopFunction<State> = (ctx, logger, nk, dispatcher, tick, state, messages) => {
    messages.forEach(m => {
        const json = JSON.parse(nk.binaryToString(m.data));
        
        if (m.opCode === OpCode.MOVE && state.matchStarted && !state.winner) {
            if (m.sender.userId !== state.turn) return;
            if (state.board[json.index] !== null) return;

            state.board[json.index] = state.marks[m.sender.userId];
            if (checkWin(state.board)) {
                state.winner = m.sender.userId;
                const loserId = Object.keys(state.presences).find(id => id !== state.winner);
                updatePlayerStats(nk, logger, state.winner, state.usernames[state.winner] || "Player", 'win', state.isRanked);
                if (loserId) updatePlayerStats(nk, logger, loserId, state.usernames[loserId] || "Player", 'loss', state.isRanked);
                dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify({ board: state.board, turn: null }));
                dispatcher.broadcastMessage(OpCode.END, JSON.stringify({ winner: state.winner }));
            } else if (state.board.every(cell => cell !== null)) {
                state.winner = "draw";
                Object.keys(state.presences).forEach(uid => updatePlayerStats(nk, logger, uid, state.usernames[uid] || "Player", 'draw', state.isRanked));
                dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify({ board: state.board, turn: null }));
                dispatcher.broadcastMessage(OpCode.END, JSON.stringify({ winner: "draw" }));
            } else {
                const userIds = Object.keys(state.presences).sort();
                state.turn = (state.turn === userIds[0]) ? userIds[1] : userIds[0];
                const updatePayload: any = { board: state.board, turn: state.turn, usernames: state.usernames };
                if (state.mode === "timed") { state.deadline = tick + 305; updatePayload.deadline = 30; }
                dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(updatePayload));
            }
        }

        if (m.opCode === OpCode.READY && !state.matchStarted) {
            state.readyPlayers[m.sender.userId] = !!json.ready;
            const userIds = Object.keys(state.presences).sort();
            if (userIds.length === 2 && userIds.every(uid => state.readyPlayers[uid])) {
                state.matchStarted = true;
                state.marks[userIds[0]] = "X"; state.marks[userIds[1]] = "O";
                state.turn = userIds[0]; state.deadline = tick + 305;
                dispatcher.broadcastMessage(OpCode.START, JSON.stringify({ marks: state.marks, turn: state.turn, mode: state.mode, usernames: state.usernames }));
                const updatePayload: any = { board: state.board, turn: state.turn, matchStarted: true, readyPlayers: state.readyPlayers, usernames: state.usernames };
                if (state.mode === "timed") updatePayload.deadline = 30;
                dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(updatePayload));
                dispatcher.matchLabelUpdate(JSON.stringify({ mode: state.mode, visibility: state.visibility, size: 2, started: true, code: state.code }));
            } else {
                dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify({ readyPlayers: state.readyPlayers, matchStarted: false }));
            }
        }
    });

    if (state.matchStarted && state.mode === "timed" && state.turn && !state.winner && tick >= state.deadline) {
        const userIds = Object.keys(state.presences).sort();
        state.winner = (state.turn === userIds[0]) ? userIds[1] : userIds[0];
        updatePlayerStats(nk, logger, state.winner, state.usernames[state.winner] || "Player", 'win', state.isRanked); 
        updatePlayerStats(nk, logger, state.turn as string, state.usernames[state.turn as string] || "Player", 'loss', state.isRanked);
        dispatcher.broadcastMessage(OpCode.END, JSON.stringify({ winner: state.winner, reason: "Turn timeout" }));
        return null;
    }

    return state.winner ? null : { state };
};

const matchSignal: nkruntime.MatchSignalFunction<State> = (ctx, logger, nk, dispatcher, tick, state, data) => ({ state, result: data });
const matchTerminate: nkruntime.MatchTerminateFunction<State> = (ctx, logger, nk, dispatcher, tick, state, graceSeconds) => ({ state });

// --- RPC HANDLERS ---

const authenticateExclusive: nkruntime.RpcFunction = (ctx, logger, nk, payload) => {
    let input = JSON.parse(payload);
    const customId = `${input.username}.${input.browser_id}`;
    
    // Authenticate/Create user
    const { userId, username, created } = nk.authenticateCustom(customId, customId, true);
    
    // RELIABLE FIX: Pass customId (name.uuid) as the official Nakama username
    // and input.username as the display name.
    try {
        nk.accountUpdateId(userId, customId, input.username);
    } catch (e) {
        logger.warn("Account update failed: %v", e);
    }
    
    const { token } = nk.authenticateTokenGenerate(userId, input.username, Math.floor(Date.now() / 1000) + 86400);
    return JSON.stringify({ token, user_id: userId, username: input.username, created });
};

const createMatchAuthoritative: nkruntime.RpcFunction = (ctx, logger, nk, payload) => {
    let params = JSON.parse(payload);
    params.hostName = params.hostName || "Player";
    let code = "", attempts = 0;
    while (attempts < 5) {
        code = Math.floor(10000 + Math.random() * 90000).toString();
        if (nk.matchList(1, true, "", 1, 1, `label.code:${code}`).length === 0) break;
        attempts++;
    }
    params.code = code;
    params.isRanked = false; // Custom rooms are NOT ranked
    return JSON.stringify({ match_id: nk.matchCreate("tic-tac-toe", params), code });
};

const findMatchByCode: nkruntime.RpcFunction = (ctx, logger, nk, payload) => {
    const { code } = JSON.parse(payload);
    const matches = nk.matchList(1, true, "", 0, 2, `label.code:${code}`);
    if (matches.length === 0) throw new Error("Match not found");
    return JSON.stringify({ match_id: matches[0].matchId });
};

const listOpenMatches: nkruntime.RpcFunction = (ctx, logger, nk, payload) => {
    return JSON.stringify({ matches: nk.matchList(10, true, null, 1, 1, "label.visibility:public") });
};

const matchmakerMatched: nkruntime.MatchmakerMatchedFunction = (ctx, logger, nk, matches) => {
    let mode = (matches.length > 0 && matches[0].properties && matches[0].properties.mode) ? matches[0].properties.mode as string : "timed";
    
    let hostName = 'Player';
    if (matches.length > 0 && matches[0].presence) {
        try {
            const accounts = nk.accountsGetId([matches[0].presence.userId]);
            if (accounts && accounts.length > 0) hostName = accounts[0].user.displayName || accounts[0].user.username.split('.')[0];
        } catch (e) {}
    }
    
    return nk.matchCreate("tic-tac-toe", { mode, visibility: 'public', hostName, isRanked: true }); 
};

// --- INITIALIZER ---

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerRpc("authenticate_exclusive", authenticateExclusive);
    initializer.registerRpc("create_match_authoritative", createMatchAuthoritative);
    initializer.registerRpc("list_open_matches", listOpenMatches);
    initializer.registerRpc("find_match_by_code", findMatchByCode);
    initializer.registerMatchmakerMatched(matchmakerMatched);

    // Ensure global leaderboard exists without purging existing data
    try {
        nk.leaderboardCreate('tictactoe_global', true, 'desc' as nkruntime.SortOrder, 'set' as nkruntime.Operator, null, { title: "Global Tic-Tac-Toe Leaderboard" });
    } catch (e) {
        // Log but don't fail; Nakama handles already-exists cases implicitly in most versions
        logger.debug("Leaderboard initialization info: %v", e);
    }
    
    initializer.registerMatch("tic-tac-toe", {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLeave: matchLeave,
        matchLoop: matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });
    logger.info("Tic-Tac-Toe Backend Initialized Successfully");
}

(globalThis as any).InitModule = InitModule;
