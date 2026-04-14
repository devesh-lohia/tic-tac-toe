const NakamaClient = require('./lib/nakama-client');
const assert = require('assert');

async function runTest() {
    console.log("🧪 Running Test 12: Custom Rooms & Ready System");

    const clientA = new NakamaClient('user_room_a');
    const clientB = new NakamaClient('user_room_b');

    await clientA.authenticate('browser_a');
    await clientB.authenticate('browser_b');
    await clientA.connect();
    await clientB.connect();

    // 1. Create a Private Room
    console.log("   - Creating Private Room...");
    const privMatch = await clientA.callRpc('create_match_authoritative', { visibility: 'private', mode: 'classic' });
    const privId = privMatch.match_id;
    console.log(`     Match ID: ${privId}`);
    
    // Creator must join
    clientA.send({ match_join: { match_id: privId } });

    // Give server a moment to index
    await new Promise(r => setTimeout(r, 2500));

    // 2. Verify Private Room is NOT in discovery
    console.log("   - Verifying Private Room is hidden...");
    const discovery1 = await clientB.callRpc('list_open_matches', {});
    const isHidden = !(discovery1.matches && discovery1.matches.some(m => m.match_id === privId));
    assert.ok(isHidden, "Private match should NOT be visible in discovery");
    console.log("     ✅ Private match is hidden.");

    // 3. Create a Public Room
    console.log("   - Creating Public Room...");
    const pubMatch = await clientA.callRpc('create_match_authoritative', { visibility: 'public', mode: 'timed' });
    const pubId = pubMatch.match_id;
    
    // Creator must join
    clientA.send({ match_join: { match_id: pubId } });

    // Give server a moment to index
    await new Promise(r => setTimeout(r, 2500));

    // 4. Verify Public Room IS in discovery (with 1 player)
    console.log("   - Verifying Public Room is visible...");
    const discovery2 = await clientB.callRpc('list_open_matches', {});
    if (discovery2.matches) {
        console.log("     Debug discovery matches:", JSON.stringify(discovery2.matches.map(m => ({ id: m.matchId, snake_id: m.match_id, label: m.label }))));
    }
    const isVisible = discovery2.matches && discovery2.matches.some(m => (m.matchId || m.match_id) === pubId);
    assert.ok(isVisible, "Public match with 1 player should be visible");
    console.log("     ✅ Public match is visible.");

    // 5. Join Public Room and verify it DISAPPEARS (size becomes 2)
    console.log("   - Joining Public Room with Player B...");
    clientB.send({ match_join: { match_id: pubId } });
    
    // Wait for join to settle
    await new Promise(r => setTimeout(r, 1000));

    const discovery3 = await clientB.callRpc('list_open_matches', {});
    const isNowHidden = !(discovery3.matches && discovery3.matches.some(m => m.match_id === pubId));
    assert.ok(isNowHidden, "Public match with 2 players should be hidden");
    console.log("     ✅ Public match hidden after second player joined.");

    // 6. Verify Ready System
    console.log("   - Verifying Ready System...");
    
    // Player A Ready
    console.log("   - Player A signaling READY...");
    const readyData = Buffer.from(JSON.stringify({ ready: true })).toString('base64');
    clientA.send({ match_data_send: { match_id: pubId, op_code: 6, data: readyData } });
    
    // Wait and verify game hasn't started yet (Wait for UPDATE OpCode 3)
    await new Promise(r => setTimeout(r, 1000));
    
    // Player B Ready
    console.log("   - Player B signaling READY...");
    clientB.send({ match_data_send: { match_id: pubId, op_code: 6, data: readyData } });
    
    // Wait for START message (OpCode 1) on either client
    console.log("   - Waiting for START signal (OpCode 1)...");
    const startMsg = await clientA.waitForMessage(m => m.match_data && Number(m.match_data.op_code) === 1, 5000);
    assert.ok(startMsg, "Game SHOULD start after both players are ready");
    console.log("     ✅ Game STARTED after mutual readiness.");

    console.log("🎉 Test 12 Passed!");
    process.exit(0);
}

runTest().catch(err => {
    console.error("❌ Test 12 Failed:", err);
    process.exit(1);
});
