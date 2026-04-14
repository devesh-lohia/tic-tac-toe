const NakamaClient = require('./lib/nakama-client');

async function testLeaderboardStats() {
    console.log("--- 📂 [TEST 05] Leaderboard & Stats Persistence (Delta Check) ---");
    const p1 = new NakamaClient('aaa_winner');
    const p2 = new NakamaClient('bbb_loser');

    try {
        const u1 = await p1.authenticate('b_win');
        const u2 = await p2.authenticate('b_loss');
        await p1.connect();
        await p2.connect();

        // 1. READ INITIAL STATE (to perform Delta-based verification)
        const iS1 = await p1.getStorage('stats', 'tictactoe', u1.user_id) || { wins: 0, points: 0, losses: 0, draws: 0 };
        const iL1 = await p1.getLeaderboard('tictactoe_global', u1.user_id) || { score: 0 };
        
        console.log(`   * Initial State for Winner: Wins=${iS1.wins}, Points=${iS1.points}, L-Score=${iL1.score}`);

        const match = await p1.callRpc('create_match_authoritative', {});
        const matchId = match.match_id;

        p1.send({ match_join: { match_id: matchId } });
        p2.send({ match_join: { match_id: matchId } });

        // Wait for Start
        const update = await p1.waitForMessage(m => m.match_data && m.match_data.op_code === 3);
        const startingTurn = JSON.parse(Buffer.from(update.match_data.data, 'base64').toString()).turn;
        console.log(`   * Match Started. First turn: ${startingTurn === u1.user_id ? 'P1' : 'P2'}`);

        // Play a game where P1 wins
        const turnOrder = (startingTurn === u1.user_id) 
            ? [{c: p1, i: 0}, {c: p2, i: 3}, {c: p1, i: 1}, {c: p2, i: 4}, {c: p1, i: 2}]
            : [{c: p2, i: 3}, {c: p1, i: 0}, {c: p2, i: 4}, {c: p1, i: 1}, {c: p2, i: 8}, {c: p1, i: 2}];

        for (const move of turnOrder) {
            move.c.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: move.i})).toString('base64') } });
            // Wait for update (syncing with server tick)
            await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
            await new Promise(r => setTimeout(r, 100));
        }

        // Wait for End
        await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 4, 5000);
        console.log("   * Match ended. Verifying deltas...");

        // Delay for server-side persistence
        console.log("   * Waiting 5s for server persistence...");
        await new Promise(r => setTimeout(r, 5000));

        // 2. VERIFY DELTAS & CONSISTENCY
        const fS1 = await p1.getStorage('stats', 'tictactoe', u1.user_id);
        const fL1 = await p1.getLeaderboard('tictactoe_global', u1.user_id);

        if (!fS1 || fS1.wins !== iS1.wins + 1) {
            console.error(`   ❌ FAILURE: Winner wins did not increment. Expected ${iS1.wins + 1}, got ${fS1 ? fS1.wins : 'null'}`);
            return false;
        }
        
        // Leaderboard should match total points from storage
        if (!fL1 || Number(fL1.score) !== Number(fS1.points)) {
            console.error(`   ❌ FAILURE: Leaderboard score inconsistent with stats. Expected ${fS1.points}, got ${fL1 ? fL1.score : 'null'}`);
            return false;
        }

        console.log(`   ✅ SUCCESS: Player stats incremented correctly (+1 win, +3 points).`);

        p1.disconnect(); p2.disconnect();
        return true;
    } catch (e) {
        console.error("   ❌ FAILURE:", e.message);
        p1.disconnect(); p2.disconnect();
        return false;
    }
}

module.exports = testLeaderboardStats;
if (require.main === module) testLeaderboardStats();
