import React, { useState, useEffect, useCallback, useRef } from 'react';
import nakama from './NakamaManager';
import log from './logger';
import { useNakamaSocket } from './hooks/useNakamaSocket';

// Components
import LoginView from './components/Login/LoginView';
import LobbyView from './components/Lobby/LobbyView';
import PregameLobby from './components/Match/PregameLobby';
import MatchView from './components/Match/MatchView';
import JoinRoomModal from './components/Modals/JoinRoomModal';
import CreateRoomModal from './components/Modals/CreateRoomModal';
import LeaderboardModal from './components/Modals/LeaderboardModal';

const App: React.FC = () => {
    // Auth & View State
    const [authenticated, setAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'login' | 'lobby' | 'match'>('login');
    
    // Lobby State
    const [matches, setMatches] = useState<any[]>([]);
    const [isQueued, setIsQueued] = useState(false);
    
    // Modals State
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [manualMatchId, setManualMatchId] = useState('');
    
    // Leaderboard Data
    const [leaderboardRecords, setLeaderboardRecords] = useState<any[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    
    // Custom Room Config State
    const [customVisibility, setCustomVisibility] = useState<'public' | 'private'>('public');
    const [customMode, setCustomMode] = useState<'timed' | 'classic'>('timed');

    // Ref for cleanup
    const matchmakerTicketRef = useRef<string | null>(null);

    // Socket Hook
    const { 
        match, 
        matchState, 
        joinMatch, 
        leaveMatch, 
        setupSocketListeners 
    } = useNakamaSocket(
        () => log.match.info("Match started!"),
        (winner) => log.match.info("Match ended", winner)
    );

    // --- REFRESH LOBBY ---
    const refreshLobby = useCallback(async () => {
        if (!authenticated) return;
        try {
            log.match.info("Refreshing match list...");
            const list = await nakama.listMatches();
            setMatches(list);
            log.match.info(`Found ${list.length} open match(es)`);
        } catch (error) {
            log.match.error("Failed to list matches", error);
        }
    }, [authenticated]);

    // Periodically refresh lobby
    useEffect(() => {
        if (authenticated && view === 'lobby' && !isQueued) {
            refreshLobby();
            const interval = setInterval(refreshLobby, 5000);
            return () => clearInterval(interval);
        }
    }, [authenticated, view, isQueued, refreshLobby]);

    // --- AUTHENTICATION ---
    const handleLogin = async () => {
        if (!username) return;
        setLoading(true);
        try {
            await nakama.authenticate(username);
            
            if (nakama.socket) {
                setupSocketListeners(nakama.socket);
            }
            
            setAuthenticated(true);
            setView('lobby');
            log.lifecycle.info("Successfully joined lobby as " + username);
        } catch (error) {
            log.lifecycle.error("Authentication check failed", error);
            alert("Connection error. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        nakama.disconnect();
        setAuthenticated(false);
        setView('login');
        log.lifecycle.info("Signed out");
    };

    // --- MATCHMAKING ---
    const handleFindOpponent = async (mode: 'timed' | 'classic') => {
        try {
            setIsQueued(true);
            log.match.info(`Searching for opponent (${mode})...`);
            const query = `properties.mode:${mode}`;
            const minCount = 2;
            const maxCount = 2;
            const stringProps = { mode };
            const numericProps = {};
            
            const ticket = await nakama.addMatchmaker(query, minCount, maxCount, stringProps, numericProps);
            matchmakerTicketRef.current = ticket.ticket;
            
            if (nakama.socket) {
                nakama.socket.onmatchmakermatched = async (matched) => {
                    log.match.info("Matchmaker matched!", matched);
                    setIsQueued(false);
                    matchmakerTicketRef.current = null;
                    const mId = matched.match_id;
                    if (mId) {
                        await handleJoinMatch(mId);
                    }
                };
            }
        } catch (error) {
            log.match.error("Matchmaking failed", error);
            setIsQueued(false);
        }
    };

    const handleCancelMatchmaking = async () => {
        if (matchmakerTicketRef.current) {
            try {
                await nakama.removeMatchmaker(matchmakerTicketRef.current);
                matchmakerTicketRef.current = null;
                setIsQueued(false);
                log.match.info("Matchmaking cancelled");
            } catch (error) {
                log.match.error("Failed to cancel matchmaking", error);
            }
        }
    };

    // --- MATCH OPERATIONS ---
    const handleJoinMatch = async (matchId: string) => {
        try {
            log.lifecycle.info("Joining match...", { id: matchId });
            await joinMatch(matchId);
            setView('match');
            setShowJoinModal(false);
        } catch (error) {
            log.match.error("❌ Failed to join match", error);
            alert("Could not join match.");
        }
    };

    const handleCreateMatch = async () => {
        try {
            log.match.info(`Creating ${customVisibility} ${customMode} match...`);
            const { matchId } = await nakama.createMatch(customVisibility, customMode);
            await handleJoinMatch(matchId);
            setShowCreateModal(false);
        } catch (error) {
            log.match.error("Failed to create match", error);
        }
    };

    const handleJoinByCode = async () => {
        if (!manualMatchId) return;
        try {
            log.match.info(`Searching for room code: ${manualMatchId}`);
            const matchId = await nakama.findMatchByCode(manualMatchId);
            await handleJoinMatch(matchId);
        } catch (error) {
            log.match.error("Room code not found", error);
            alert("No match found with that code.");
        }
    };

    const handleQuitMatch = async () => {
        await leaveMatch();
        setView('lobby');
        refreshLobby();
    };

    const handleMove = (index: number) => {
        if (!match || !matchState.turn || matchState.turn !== nakama.session?.user_id) return;
        nakama.sendMatchMove(match.match_id || match.matchId, index);
    };

    const handleReady = () => {
        const isReady = !matchState.readyPlayers[nakama.session?.user_id || ''];
        nakama.sendReadyStatus(match.match_id || match.matchId, isReady);
    };

    // --- LEADERBOARD ---
    const handleShowLeaderboard = async () => {
        setShowLeaderboard(true);
        setLeaderboardLoading(true);
        try {
            const records = await nakama.listLeaderboard();
            setLeaderboardRecords(records);
        } catch (error) {
            log.match.error("Failed to fetch leaderboard", error);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    // --- RENDERING ---
    if (view === 'login') {
        return <LoginView username={username} setUsername={setUsername} onLogin={handleLogin} loading={loading} />;
    }

    if (view === 'match' && match) {
        if (!matchState.matchStarted) {
            return (
                <PregameLobby 
                    match={match} 
                    matchState={matchState} 
                    onReady={handleReady} 
                    onQuit={handleQuitMatch}
                    roomCode={manualMatchId || '#####'}
                />
            );
        }
        return (
            <MatchView 
                matchState={matchState} 
                selfId={nakama.session?.user_id || ''} 
                onMove={handleMove} 
                onQuit={handleQuitMatch} 
            />
        );
    }

    return (
        <>
            <LobbyView 
                username={username}
                matches={matches}
                onRefresh={refreshLobby}
                onJoinByCode={() => setShowJoinModal(true)}
                onShowCreate={() => setShowCreateModal(true)}
                onJoinMatch={handleJoinMatch}
                onFindOpponent={handleFindOpponent}
                onCancelMatchmaking={handleCancelMatchmaking}
                onShowLeaderboard={handleShowLeaderboard}
                onSignOut={handleSignOut}
                isQueued={isQueued}
            />

            {showJoinModal && (
                <JoinRoomModal 
                    manualMatchId={manualMatchId}
                    setManualMatchId={setManualMatchId}
                    onClose={() => setShowJoinModal(false)}
                    onJoin={handleJoinByCode}
                />
            )}

            {showCreateModal && (
                <CreateRoomModal 
                    customVisibility={customVisibility}
                    setCustomVisibility={setCustomVisibility}
                    customMode={customMode}
                    setCustomMode={setCustomMode}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateMatch}
                />
            )}

            {showLeaderboard && (
                <LeaderboardModal 
                    records={leaderboardRecords}
                    loading={leaderboardLoading}
                    onClose={() => setShowLeaderboard(false)}
                />
            )}
        </>
    );
};

export default App;
