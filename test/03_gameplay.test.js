const NakamaClient = require('./lib/nakama-client');

async function testGameplay() {
    console.log("--- 📂 [TEST 03] Authoritative Gameplay Logic ---");
    const p1 = new NakamaClient('aaa_p1');
    const p2 = new NakamaClient('bbb_p2');

    try {
        const u1 = await p1.authenticate('bx');
        const u2 = await p2.authenticate('bo');
        await p1.connect();
        await p2.connect();

        const match = await p1.callRpc('create_match_authoritative', {});
        const matchId = match.match_id;

        p1.send({ match_join: { match_id: matchId } });
        p2.send({ match_join: { match_id: matchId } });

        // Wait for game start sync (UPDATE from join)
        const joinUpdate = await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        const initialData = JSON.parse(Buffer.from(joinUpdate.match_data.data, 'base64').toString());
        const startingTurn = initialData.turn;
        
        const startingPlayer = (startingTurn === u1.user_id) ? p1 : p2;
        const secondPlayer = (startingTurn === u1.user_id) ? p2 : p1;
        
        console.log(`   * Game Synchronized. Starting Turn: ${startingTurn === u1.user_id ? 'P1' : 'P2'}`);

        // NAKAMA AUTHORITATIVE VALIDATION: Try illegal move (non-starting player moves)
        console.log("   * Testing Rule Enforcement: Out-of-turn move...");
        secondPlayer.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 4})).toString('base64') } });
        await new Promise(r => setTimeout(r, 600));

        // Starting player takes turn
        startingPlayer.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 0})).toString('base64') } });
        
        // Wait for board update
        const update1 = await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        const board = JSON.parse(Buffer.from(update1.match_data.data, 'base64').toString()).board;

        if (board[4] !== null) {
            console.error("   ❌ FAILURE: Illegal out-of-turn move was processed!");
            return false;
        }
        console.log("   ✅ SUCCESS: Server correctly enforced turn order.");

        // Play to win (Starting player moves 0, 1, 2)
        // Order: SP(0), 2P(3), SP(1), 2P(4), SP(2)
        const winMoves = [
            { c: secondPlayer, i: 3 }, { c: startingPlayer, i: 1 },
            { c: secondPlayer, i: 4 }, { c: startingPlayer, i: 2 }
        ];

        for(const m of winMoves) {
            m.c.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: m.i})).toString('base64') } });
            // Wait for update back from server to ensure tick was processed
            await p1.waitForMessage(msg => msg.match_data && Number(msg.match_data.op_code) === 3);
            await new Promise(r => setTimeout(r, 100)); // Minor buffer
        }

        console.log("   * Moves complete. Waiting for win detection (Op 4)...");
        const endMsg = await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 4, 15000);
        const winnerId = JSON.parse(Buffer.from(endMsg.match_data.data, 'base64').toString()).winner;
        
        console.log(`   * Expected Winner (Starting Player): ${startingTurn}`);
        console.log(`   * Actual Winner Reported by Server: ${winnerId}`);

        if (winnerId === startingTurn) {
            console.log("   ✅ SUCCESS: Authoritative win detected.");
            p1.disconnect(); p2.disconnect();
            return true;
        }
        console.error("   ❌ FAILURE: Winner UID mismatch.");
        return false;
    } catch (e) {
        console.error("   ❌ FAILURE:", e.message);
        p1.disconnect(); p2.disconnect();
        return false;
    }
}

module.exports = testGameplay;
if (require.main === module) testGameplay();
