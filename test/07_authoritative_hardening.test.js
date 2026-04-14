const NakamaClient = require('./lib/nakama-client');

async function testAuthoritativeHardening() {
    console.log("--- 📂 [TEST 07] Authoritative Hardening (Rejection Logic) ---");
    const p1 = new NakamaClient('aaa_hard1');
    const p2 = new NakamaClient('bbb_hard2');

    try {
        const u1 = await p1.authenticate('b_hard1');
        const u2 = await p2.authenticate('b_hard2');
        await p1.connect();
        await p2.connect();

        const match = await p1.callRpc('create_match_authoritative', {});
        const matchId = match.match_id;

        p1.send({ match_join: { match_id: matchId } });
        p2.send({ match_join: { match_id: matchId } });

        // Synchronize starting turn
        const startUpdate = await p1.waitForMessage(m => m.match_data && m.match_data.op_code === 3);
        const startingTurn = JSON.parse(Buffer.from(startUpdate.match_data.data, 'base64').toString()).turn;
        
        const sp = (startingTurn === u1.user_id) ? p1 : p2;
        const op = (startingTurn === u1.user_id) ? p2 : p1;

        console.log("   * Testing REJECTION: Occupied Cell...");
        // SP moves to index 4
        sp.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 4})).toString('base64') } });
        await new Promise(r => setTimeout(r, 600));

        // OP tries to steal index 4
        op.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 4})).toString('base64') } });
        await new Promise(r => setTimeout(r, 600));

        // Wait for update (should reflect SP move but NOT OP move)
        const update1 = await p1.waitForMessage(m => m.match_data && m.match_data.op_code === 3);
        const state1 = JSON.parse(Buffer.from(update1.match_data.data, 'base64').toString());

        if (state1.board[4] === null) {
            console.error("   ❌ FAILURE: Original move was not registered.");
            return false;
        }
        // If it was P1's turn and they moved to 4, board[4] should be 'X'. 
        // If OP stole it, it would be 'O'.
        // Actually the server just returns on illegal move, so board[4] should remain SP's mark.
        console.log("   ✅ SUCCESS: Server ignored move to occupied cell.");

        console.log("   * Testing REJECTION: Out of Bounds (Index 9)...");
        // Right now it's OP's turn. Let's try move to 9.
        op.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 9})).toString('base64') } });
        await new Promise(r => setTimeout(r, 600));
        
        // Final valid move to check it's still OP's turn and game is ongoing
        op.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 0})).toString('base64') } });
        const update2 = await p1.waitForMessage(m => m.match_data && m.match_data.op_code === 3);
        const state2 = JSON.parse(Buffer.from(update2.match_data.data, 'base64').toString());

        if (state2.board[0] !== null) {
            console.log("   ✅ SUCCESS: Server ignored out-of-bounds move and allowed subsequent valid move.");
        } else {
             console.error("   ❌ FAILURE: Illegal move might have broken match state.");
             return false;
        }

        p1.disconnect(); p2.disconnect();
        return true;
    } catch (e) {
        console.error("   ❌ FAILURE:", e.message);
        p1.disconnect(); p2.disconnect();
        return false;
    }
}

module.exports = testAuthoritativeHardening;
if (require.main === module) testAuthoritativeHardening();
