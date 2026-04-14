const NakamaClient = require('./lib/nakama-client');

async function playMatch(p1, p2, winnerIndex) {
    p1.messageQueue = []; // Native Enhancement: Clear stale messages
    p2.messageQueue = [];

    const match = await p1.callRpc('create_match_authoritative', {});
    const matchId = match.match_id;

    p1.send({ match_join: { match_id: matchId } });
    p2.send({ match_join: { match_id: matchId } });

    const update = await p1.waitForMessage(m => m.match_data && m.match_data.op_code === 3);
    const startingTurn = JSON.parse(Buffer.from(update.match_data.data, 'base64').toString()).turn;
    
    // Use the match state to find the IDs if needed, but we can just pass them in
    const u1 = (await p1.authenticate('b_str1')).user_id; 
    const u2 = (await p2.authenticate('b_str2')).user_id;

    // Define sequences to make P1 or P2 win
    let turnOrder;
    if (winnerIndex === 1) { // P1 Wins
        turnOrder = (startingTurn === u1) 
            ? [{c: p1, i: 0}, {c: p2, i: 3}, {c: p1, i: 1}, {c: p2, i: 4}, {c: p1, i: 2}]
            : [{c: p2, i: 3}, {c: p1, i: 0}, {c: p2, i: 4}, {c: p1, i: 1}, {c: p2, i: 8}, {c: p1, i: 2}];
    } else { // P2 Wins
        turnOrder = (startingTurn === u2)
            ? [{c: p2, i: 0}, {c: p1, i: 3}, {c: p2, i: 1}, {c: p1, i: 4}, {c: p2, i: 2}]
            : [{c: p1, i: 3}, {c: p2, i: 0}, {c: p1, i: 4}, {c: p2, i: 1}, {c: p1, i: 8}, {c: p2, i: 2}];
    }

    for (const move of turnOrder) {
        move.c.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: move.i})).toString('base64') } });
        // Sync with server
        await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        await new Promise(r => setTimeout(r, 100));
    }

    await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 4, 5000);
    await new Promise(r => setTimeout(r, 5000)); // Persistence wait
    return matchId;
}

async function testWinStreak() {
    console.log("--- 📂 [TEST 09] Native Win Streaks (Persistence) ---");
    const p1 = new NakamaClient('aaa_streak1');
    const p2 = new NakamaClient('bbb_streak2');

    try {
        const u1 = (await p1.authenticate('b_str1')).user_id;
        const u2 = (await p2.authenticate('b_str2')).user_id;
        await p1.connect();
        await p2.connect();

        const initialStats = await p1.getStorage('stats', 'tictactoe', u1) || { wins: 0 };
        const initialWins = initialStats.wins || 0;
        console.log(`   * Initial Wins for P1: ${initialWins}`);

        console.log("   * P1 winning Game 1...");
        await playMatch(p1, p2, 1);
        const s1 = await p1.getStorage('stats', 'tictactoe', u1);
        if (s1.wins !== initialWins + 1) {
            console.error(`   ❌ FAILURE: Wins should be ${initialWins + 1}, got ${s1.wins}`);
            return false;
        }

        console.log("   * P1 winning Game 2 (Consecutive)...");
        await playMatch(p1, p2, 1);
        const s2 = await p1.getStorage('stats', 'tictactoe', u1);
        if (s2.wins !== initialWins + 2) {
            console.error(`   ❌ FAILURE: Wins should be ${initialWins + 2}, got ${s2.wins}`);
            return false;
        }
        console.log(`   ✅ SUCCESS: Wins incremented correctly to ${initialWins + 2}.`);

        console.log("   * P1 losing Game 3...");
        await playMatch(p1, p2, 2);
        const s3 = await p1.getStorage('stats', 'tictactoe', u1);
        if (s3.wins !== initialWins + 2) {
            console.error("   ❌ FAILURE: Wins should remain at", initialWins + 2, "got", s3.wins);
            return false;
        }
        console.log("   ✅ SUCCESS: Wins remained consistent after loss.");

        // Check leaderboard for consistency
        const lb = await p1.getLeaderboard('tictactoe_global', u1);
        if (!lb || Number(lb.score) !== Number(s3.points)) {
             console.error("   ❌ FAILURE: Leaderboard score inconsistent with stats:", lb);
             return false;
        }
        console.log("   ✅ SUCCESS: Leaderboard metadata synchronized.");

        p1.disconnect(); p2.disconnect();
        return true;
    } catch (e) {
        console.error("   ❌ FAILURE:", e.message);
        p1.disconnect(); p2.disconnect();
        return false;
    }
}

module.exports = testWinStreak;
if (require.main === module) testWinStreak();
