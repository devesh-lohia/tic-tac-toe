const testAuth = require('./01_auth.test');
const testMatchmaking = require('./02_matchmaking.test');
const testGameplay = require('./03_gameplay.test');
const testTimeout = require('./04_timeout.test');
const testStats = require('./05_leaderboard_stats.test');
const testDraw = require('./06_draw.test');
const testHardening = require('./07_authoritative_hardening.test');
const testDiscovery = require('./08_match_discovery.test');
const testStreak = require('./09_win_streak.test');
const testDisconnection = require('./10_disconnection.test');
const testAdvancedNatives = require('./11_advanced_natives.test');

async function runSuite() {
    console.log("==================================================");
    console.log("   NAKAMA BACKEND QUALITY ASSURANCE SUITE (V4)");
    console.log("==================================================\n");

    const tasks = [
        { name: "Authentication Flow", fn: testAuth },
        { name: "Native Matchmaking", fn: testMatchmaking },
        { name: "Authoritative Gameplay", fn: testGameplay },
        { name: "Authoritative Timer", fn: testTimeout },
        { name: "Leaderboard & Stats", fn: testStats },
        { name: "Authoritative Draw", fn: testDraw },
        { name: "Authoritative Hardening", fn: testHardening },
        { name: "Native Room Discovery", fn: testDiscovery },
        { name: "Native Win Streaks", fn: testStreak },
        { name: "Graceful Disconnection", fn: testDisconnection },
        { name: "Advanced Native Features", fn: testAdvancedNatives }
    ];

    let results = [];

    for (const task of tasks) {
        try {
            const success = await task.fn();
            results.push({ name: task.name, status: success ? "PASSED ✅" : "FAILED ❌" });
        } catch (e) {
            results.push({ name: task.name, status: "ERROR 💥" });
        }
        console.log("");
    }

    console.log("==================================================");
    console.log("   FINAL REPORT");
    console.log("==================================================");
    results.forEach(r => {
        console.log(`${r.name.padEnd(25)} : ${r.status}`);
    });
    console.log("==================================================");

    const anyFailed = results.some(r => r.status !== "PASSED ✅");
    process.exit(anyFailed ? 1 : 0);
}

runSuite();
