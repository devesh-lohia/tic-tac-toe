const NakamaClient = require('./lib/nakama-client');

async function testDisconnection() {
    console.log("--- 📂 [TEST 10] Graceful Disconnection (Forfeit) ---");
    const p1 = new NakamaClient('aaa_leaver');
    const p2 = new NakamaClient('bbb_stayer');

    try {
        const u1 = await p1.authenticate('b_leave');
        const u2 = await p2.authenticate('b_stay');
        await p1.connect();
        await p2.connect();

        const match = await p1.callRpc('create_match_authoritative', {});
        const matchId = match.match_id;

        p1.send({ match_join: { match_id: matchId } });
        p2.send({ match_join: { match_id: matchId } });

        // Wait for game start sync
        await p2.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        console.log("   * Game Initialized. P1 disconnecting...");

        // P1 disconnects mid-game
        p1.disconnect();

        // 1. P2 should receive a match end message (OpCode 4)
        console.log("   * Waiting for match end notification (Op 4)...");
        const endMsg = await p2.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 4, 10000);
        const data = JSON.parse(Buffer.from(endMsg.match_data.data, 'base64').toString());

        if (data.winner === u2.user_id || data.reason === "Player disconnected") {
            console.log("   ✅ SUCCESS: Server correctly declared P2 winner after P1's disconnect.");
            p2.disconnect();
            return true;
        } else {
            console.error("   ❌ FAILURE: Winner not declared correctly after disconnect:", data);
            p2.disconnect();
            return false;
        }
    } catch (e) {
        console.error("   ❌ FAILURE:", e.message);
        p1.disconnect(); p2.disconnect();
        return false;
    }
}

module.exports = testDisconnection;
if (require.main === module) testDisconnection();
