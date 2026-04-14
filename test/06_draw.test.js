const NakamaClient = require('./lib/nakama-client');

async function testDraw() {
    console.log("--- 📂 [TEST 06] Authoritative Draw (Cat's Game) ---");
    const p1 = new NakamaClient('aaa_draw1');
    const p2 = new NakamaClient('bbb_draw2');

    try {
        const u1 = await p1.authenticate('b_draw1');
        const u2 = await p2.authenticate('b_draw2');
        await p1.connect();
        await p2.connect();

        const match = await p1.callRpc('create_match_authoritative', {});
        const matchId = match.match_id;

        p1.send({ match_join: { match_id: matchId } });
        p2.send({ match_join: { match_id: matchId } });

        // Synchronize starting turn
        const update = await p1.waitForMessage(m => m.match_data && m.match_data.op_code === 3);
        const startingTurn = JSON.parse(Buffer.from(update.match_data.data, 'base64').toString()).turn;
        
        const sp = (startingTurn === u1.user_id) ? p1 : p2;
        const op = (startingTurn === u1.user_id) ? p2 : p1;

        console.log(`   * Match Started. First turn: ${startingTurn === u1.user_id ? 'P1' : 'P2'}`);

        // Draw Sequence (No wins):
        // SP: 0, 1, 5, 6, 4
        // OP: 3, 2, 7, 8
        const moves = [
            {c: sp, i: 0}, {c: op, i: 3},
            {c: sp, i: 1}, {c: op, i: 2},
            {c: sp, i: 5}, {c: op, i: 7},
            {c: sp, i: 6}, {c: op, i: 8},
            {c: sp, i: 4}
        ];

        for (const m of moves) {
            m.c.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: m.i})).toString('base64') } });
            // Sync with server tick
            await p1.waitForMessage(msg => msg.match_data && Number(msg.match_data.op_code) === 3);
            await new Promise(r => setTimeout(r, 100));
        }

        const endMsg = await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 4, 5000);
        const result = JSON.parse(Buffer.from(endMsg.match_data.data, 'base64').toString());

        if (result.winner === "draw") {
            console.log("   ✅ SUCCESS: Server correctly detected draw.");
            p1.disconnect(); p2.disconnect();
            return true;
        }
        console.error("   ❌ FAILURE: Unexpected game outcome:", result.winner);
        return false;
    } catch (e) {
        console.error("   ❌ FAILURE:", e.message);
        p1.disconnect(); p2.disconnect();
        return false;
    }
}

module.exports = testDraw;
if (require.main === module) testDraw();
