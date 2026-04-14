const NakamaClient = require('./lib/nakama-client');
const assert = require('assert');

async function runTest() {
    console.log("🧪 Running Test 13: Strict Privacy Discovery");

    const clientA = new NakamaClient('user_privacy_a');
    const clientB = new NakamaClient('user_privacy_b');

    await clientA.authenticate('privacy_a');
    await clientB.authenticate('privacy_b');
    await clientA.connect();
    await clientB.connect();

    // 1. Create a Private Room
    console.log("   - Creating PRIVATE Room...");
    const privMatch = await clientA.callRpc('create_match_authoritative', { visibility: 'private', mode: 'classic' });
    const privId = privMatch.match_id;
    console.log(`     Private ID: ${privId}`);
    
    // Creator joins
    await clientA.send({ match_join: { match_id: privId } });

    // 2. Create a Public Room
    console.log("   - Creating PUBLIC Room...");
    const pubMatch = await clientA.callRpc('create_match_authoritative', { visibility: 'public', mode: 'timed' });
    const pubId = pubMatch.match_id;
    console.log(`     Public ID: ${pubId}`);
    
    // Creator joins (Wait, creator can only be in one match? No, Nakama allows it but our logic might not. 
    // Let's use Client B for the public room to be safe and clear.)
    const clientC = new NakamaClient('user_privacy_c');
    await clientC.authenticate('privacy_c');
    await clientC.connect();
    await clientC.send({ match_join: { match_id: pubId } });

    // 3. Wait for Discovery Indexing
    console.log("   - Waiting 3 seconds for discovery indexing...");
    await new Promise(r => setTimeout(r, 3000));

    // 4. Verify Lobby Results
    console.log("   - Fetching Lobby List...");
    const discovery = await clientB.callRpc('list_open_matches', {});
    
    const matches = discovery.matches || [];
    console.log(`     Total matches found: ${matches.length}`);

    const isPrivateFound = matches.some(m => (m.matchId || m.match_id) === privId);
    const isPublicFound = matches.some(m => (m.matchId || m.match_id) === pubId);

    // Assertions
    assert.strictEqual(isPrivateFound, false, "❌ FAIL: Private match MUST NOT be visible in discovery");
    console.log("     ✅ SUCCESS: Private match is correctly hidden.");

    assert.strictEqual(isPublicFound, true, "❌ FAIL: Public match MUST be visible in discovery");
    console.log("     ✅ SUCCESS: Public match is correctly visible.");

    console.log("🎉 Test 13 Passed: Strict Privacy Enforced!");
    process.exit(0);
}

runTest().catch(err => {
    console.error("❌ Test 13 Failed:", err);
    process.exit(1);
});
