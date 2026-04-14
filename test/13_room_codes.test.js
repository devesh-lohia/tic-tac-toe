const NakamaClient = require('./lib/nakama-client');
const assert = require('assert');

async function runTest() {
    console.log("🧪 Running Test 13: 5-Digit Room Codes");

    const client = new NakamaClient('tester_' + Math.floor(Math.random() * 1000));
    await client.authenticate('browser_tester');
    await client.connect();

    // 1. Create a match and verify a 5-digit numeric code
    console.log("   - Creating match and verifying 5-digit code...");
    const createResult = await client.callRpc('create_match_authoritative', { visibility: 'private', mode: 'classic' });
    assert.ok(createResult.match_id, "Match ID should be present");
    assert.ok(createResult.code, "Room Code should be present");
    assert.match(createResult.code, /^\d{5}$/, "Code should be exactly 5 digits");
    const { match_id, code } = createResult;
    console.log(`     Match ID: ${match_id}`);
    console.log(`     Room Code: ${code}`);

    // Wait for Nakama to index the new match label
    console.log("     Waiting for indexing (2s)...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Find match using its 5-digit code
    console.log("   - Verifying match resolution by code...");
    const findResult = await client.callRpc('find_match_by_code', { code });
    assert.strictEqual(findResult.match_id, match_id, "Resolved Match ID should match the original UUID");
    console.log("     ✅ Code resolved successfully.");

    // 3. Verify automatic ID release after room destruction
    console.log("   - Verifying code release after room destruction...");
    
    // Join match to make it active (size > 0)
    console.log("     Joining match...");
    client.send({ match_join: { match_id } });
    
    // Wait for join to settle
    await new Promise(r => setTimeout(r, 1000));

    // Leave match (should trigger destruction since it's the only player)
    console.log("     Leaving match...");
    client.send({ match_leave: { match_id } });

    // Wait for Nakama to process termination and cleanup labels
    console.log("     Waiting for cleanup (2s)...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to find the match by code again - should fail
    try {
        await client.callRpc('find_match_by_code', { code });
        assert.fail("Should have thrown error because match is destroyed");
    } catch (error) {
        assert.ok(error.message.includes("Match not found"), "Error should indicate match not found");
        console.log("     ✅ Code effectively released (No match found).");
    }

    console.log("🎉 Test 13 Passed!");
    process.exit(0);
}

runTest().catch(err => {
    console.error("❌ Test 13 Failed:", err);
    process.exit(1);
});
