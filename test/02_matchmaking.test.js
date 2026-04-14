const NakamaClient = require('./lib/nakama-client');

async function testMatchmaking() {
    console.log("--- 📂 [TEST 02] Native Matchmaking ---");
    const p1 = new NakamaClient('player1');
    const p2 = new NakamaClient('player2');

    try {
        await p1.authenticate('b1');
        await p2.authenticate('b2');
        await p1.connect();
        await p2.connect();

        // Give the matchmaker time to ingest tickets if needed
        await new Promise(r => setTimeout(r, 2000));

        console.log("   * Entering Matchmaker Queue...");
        p1.send({ matchmaker_add: { min_count: 2, max_count: 2, query: "*" } });
        p2.send({ matchmaker_add: { min_count: 2, max_count: 2, query: "*" } });

        const matched = await p1.waitForMessage(m => m.matchmaker_matched, 15000);
        
        if (matched.matchmaker_matched && matched.matchmaker_matched.match_id) {
            console.log(`   ✅ SUCCESS: Paired into match ${matched.matchmaker_matched.match_id}`);
            
            p1.send({ match_join: { match_id: matched.matchmaker_matched.match_id } });
            p2.send({ match_join: { match_id: matched.matchmaker_matched.match_id } });

            // Wait for synchronization (UPDATE state)
            await p1.waitForMessage(m => m.match_data && m.match_data.op_code === 3);
            console.log("   ✅ SUCCESS: Joined and synchronized matched authoritative match.");

            p1.disconnect(); p2.disconnect();
            return true;
        }
        return false;
    } catch (e) {
        console.error("   ❌ FAILURE:", e.message);
        p1.disconnect(); p2.disconnect();
        return false;
    }
}

module.exports = testMatchmaking;
if (require.main === module) testMatchmaking();
