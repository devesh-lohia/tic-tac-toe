import { useState, useCallback } from 'react';
import nakama from '../NakamaManager';
import log from '../logger';

export interface MatchState {
    board: (string | null)[];
    turn: string | null;
    winner: string | null;
    marks: { [userId: string]: string };
    presences: any[];
    matchStarted: boolean;
    readyPlayers: { [userId: string]: boolean };
    usernames: { [userId: string]: string };
    deadline?: number;
    mode?: 'timed' | 'classic';
}

export function useNakamaSocket(onMatchStart?: () => void, onMatchEnd?: (winner: string | null) => void) {
    const [match, setMatch] = useState<any>(null);
    const [matchState, setMatchState] = useState<MatchState>({
        board: Array(9).fill(null),
        turn: null,
        winner: null,
        marks: {},
        presences: [],
        matchStarted: false,
        readyPlayers: {},
        usernames: {}
    });

    const handleMatchData = useCallback((data: any) => {
        const opCode = data.op_code;
        const payload = data.data ? JSON.parse(new TextDecoder().decode(data.data)) : {};
        log.match.debug(`↓ Received OpCode ${opCode}`, payload);

        switch (opCode) {
            case 1: // START
                setMatchState(prev => ({ 
                    ...prev, 
                    marks: payload.marks, 
                    turn: payload.turn,
                    matchStarted: true,
                    mode: payload.mode,
                    usernames: payload.usernames || prev.usernames
                }));
                onMatchStart?.();
                break;
            case 3: // UPDATE
                setMatchState(prev => ({ 
                    ...prev, 
                    board: payload.board ?? prev.board, 
                    turn: payload.turn !== undefined ? payload.turn : prev.turn,
                    readyPlayers: payload.readyPlayers ?? prev.readyPlayers,
                    matchStarted: payload.matchStarted ?? prev.matchStarted,
                    usernames: payload.usernames ?? prev.usernames,
                    deadline: payload.deadline
                }));
                break;
            case 4: // END
                setMatchState(prev => ({ ...prev, winner: payload.winner, turn: null }));
                onMatchEnd?.(payload.winner);
                break;
        }
    }, [onMatchStart, onMatchEnd]);

    const setupSocketListeners = useCallback((socket: any) => {
        // cast to any to bypass strict SDK types if necessary, or use the correct property
        (socket as any).onmatchdata = handleMatchData;
    }, [handleMatchData]);

    const joinMatch = async (matchId: string) => {
        try {
            const m = await nakama.joinMatch(matchId);
            setMatch(m);
            setMatchState(prev => ({
                ...prev,
                presences: m.presences || [],
                board: Array(9).fill(null),
                winner: null,
                matchStarted: false
            }));
            return m;
        } catch (error) {
            log.match.error("Failed to join match in hook", error);
            throw error;
        }
    };

    const leaveMatch = async () => {
        if (match && nakama.socket) {
            try {
                await nakama.socket.leaveMatch(match.match_id || match.matchId);
            } catch (e) {
                log.match.error("Error leaving match", e);
            }
            setMatch(null);
            setMatchState({
                board: Array(9).fill(null),
                turn: null,
                winner: null,
                marks: {},
                presences: [],
                matchStarted: false,
                readyPlayers: {},
                usernames: {}
            });
        }
    };

    return {
        match,
        matchState,
        setMatch,
        setMatchState,
        joinMatch,
        leaveMatch,
        setupSocketListeners
    };
}
