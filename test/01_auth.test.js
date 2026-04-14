const NakamaClient = require('./lib/nakama-client');

async function testAuth() {
    console.log("--- 📂 [TEST 01] Authentication System ---");
    const client = new NakamaClient('indie_dev');
    
    try {
        const result = await client.authenticate('browser_abc_123');
        
        if (result.username === 'indie_dev.browser_abc_123' && result.token) {
            console.log("   ✅ SUCCESS: Deterministic identity generated correctly.");
            return true;
        } else {
            console.error("   ❌ FAILURE: Identification mismatch.", result);
            return false;
        }
    } catch (e) {
        console.error("   ❌ FAILURE: Server connection error.", e.message);
        return false;
    }
}

module.exports = testAuth;
if (require.main === module) testAuth();
