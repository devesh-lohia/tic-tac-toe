const NakamaClient = require('./lib/nakama-client');

async function testTimeout() {
    console.log("--- 📂 [TEST 04] Authoritative Clock (30s Timeout) ---");
    const p1 = new NakamaClient('aaa_idle');
    const p2 = new NakamaClient('bbb_active');

    try {
        const u1 = await p1.authenticate('b_idle');
        const u2 = await p2.authenticate('b_active');
        await p1.connect();
        await p2.connect();

        const match = await p1.callRpc('create_match_authoritative', {});
        const matchId = match.match_id;

        p1.send({ match_join: { match_id: matchId } });
        p2.send({ match_join: { match_id: matchId } });

        // WAIT FOR START SYNC (Important: ensures the authoritative clock is running)
        const joinUpdate = await p2.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        const initialData = JSON.parse(Buffer.from(joinUpdate.match_data.data, 'base64').toString());
        const startingTurn = initialData.turn;

        if (startingTurn === u2.user_id) {
            console.log("   * P2 (Active) starting first. Moving at index 4 to pass turn to P1 (Idle)...");
            p2.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 4})).toString('base64') } });
            // Wait for turn to switch
            await p2.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        }

        console.log("   * Game Initialized. P1 (Idle) is active. Waiting 32s for forfeit...");

        // We actually have to wait in the test system
        const timeoutMsg = await p2.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 4, 45000);
        const data = JSON.parse(Buffer.from(timeoutMsg.match_data.data, 'base64').toString());

        if (data.winner === u2.user_id) {
            console.log("   ✅ SUCCESS: Server automatically forfeited idle player.");
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

module.exports = testTimeout;
if (require.main === module) testTimeout();
