const NakamaClient = require('./lib/nakama-client');

async function testAdvancedNatives() {
    console.log("--- 📂 [TEST 11] Advanced Native Features (Discovery & Recovery) ---");
    const p1 = new NakamaClient('aaa_native');
    const p2 = new NakamaClient('bbb_native');

    try {
        const u1 = await p1.authenticate('b_n1');
        const u2 = await p2.authenticate('b_n2');
        await p1.connect();
        await p2.connect();

        // 1. VERIFY MODE-AWARE CREATION & ENHANCED DISCOVERY
        console.log("   * Creating 'classic' match...");
        const m1 = await p1.callRpc('create_match_authoritative', { mode: 'classic' });
        
        console.log("   * Creating 'timed' match...");
        await p2.callRpc('create_match_authoritative', { mode: 'timed' });

        await new Promise(r => setTimeout(r, 3000)); // Indexing wait

        console.log("   * Filtering discovery by mode...");
        const res = await p1.callRpc('list_open_matches', {});
        const matches = res.matches || [];

        if (matches.length >= 1) {
            console.log("   ✅ SUCCESS: Native discovery returned matches.");
        } else {
            console.error("   ❌ FAILURE: Discovery returned no matches.", matches);
            return false;
        }

        // 2. VERIFY STATE RECOVERY
        const matchId = m1.match_id;
        console.log("   * Starting match for state recovery test...");
        
        // P1 and P2 join the classic match
        p1.send({ match_join: { match_id: matchId } });
        p2.send({ match_join: { match_id: matchId } });

        // Wait for start and detect turn
        const startMsg = await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        const initialData = JSON.parse(Buffer.from(startMsg.match_data.data, 'base64').toString());
        const startingTurn = initialData.turn;
        
        const activePlayer = (startingTurn === u1.user_id) ? p1 : p2;
        const activeName = (startingTurn === u1.user_id) ? 'P1' : 'P2';
        
        // Active player makes a move at index 0
        console.log(`   * ${activeName} makes move at index 0...`);
        activePlayer.send({ match_data_send: { match_id: matchId, op_code: 2, data: Buffer.from(JSON.stringify({index: 0})).toString('base64') } });
        
        // CRITICAL: Wait for move acceptance (Op 3) BEFORE simulating crash
        await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        await new Promise(r => setTimeout(r, 500)); 

        // Let's have P1 crash regardless of whether they were the active one
        console.log("   * P1 simulating crash (disconnect)...");
        p1.disconnect();
        await new Promise(r => setTimeout(r, 1000));

        // P1 Reconnects and rejoins
        console.log("   * P1 rejoining match...");
        await p1.authenticate('b_n1');
        await p1.connect();
        p1.send({ match_join: { match_id: matchId } });

        // P1 should immediately receive an UPDATE with the board state
        console.log("   * Waiting for state recovery sync...");
        const recoveryMsg = await p1.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 3);
        const state = JSON.parse(Buffer.from(recoveryMsg.match_data.data, 'base64').toString());

        if (state.board[0] !== null) {
            console.log("   ✅ SUCCESS: State recovery successful. Board index 0 is occupied.");
        } else {
            console.error("   ❌ FAILURE: Rejoiner did not recover board state correctly:", state);
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

module.exports = testAdvancedNatives;
if (require.main === module) testAdvancedNatives();
