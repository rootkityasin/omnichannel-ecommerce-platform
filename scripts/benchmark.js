const autocannon = require('autocannon');

const url = process.argv[2] || 'http://crabkhai.localhost:3000';

console.log(`\n🚀 STARTING SERVER BENCHMARK...`);
console.log(`Target: ${url}`);
console.log(`Simulating: 50 Concurrent Connections for 10 seconds...\n`);

const instance = autocannon({
    url,
    connections: 50, // 50 simulated users hammering at once
    duration: 10,    // 10 seconds
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    }
}, (err, result) => {
    if (err) {
        console.error(err);
        return;
    }

    const rps = result.requests.mean;
    const latency = result.latency.mean;

    // Calculate Concurrent Users based on "Think Time"
    // "Think Time" is how long a real user waits between clicks.
    // Real Capacity = RPS * Think Time

    const heavyUser = Math.floor(rps * 5);   // Fast clicker (every 5s)
    const avgUser = Math.floor(rps * 15);    // Standard shopper (every 15s)
    const lightUser = Math.floor(rps * 45);  // Browsing/Reading (every 45s)

    console.log('\n\n📊 BENCHMARK REPORT');
    console.log('============================================');
    console.log(`⚡ Raw Speed:       ${rps.toFixed(2)} requests per second`);
    console.log(`⏱️  Avg Latency:     ${latency.toFixed(2)} ms`);
    console.log('============================================');
    console.log('👥 ESTIMATED REAL-WORLD CAPACITY');
    console.log(`(How many users can be on the site at once?)`);
    console.log('--------------------------------------------');
    console.log(`🔥 Heavy Load (Black Friday):   ~${heavyUser.toLocaleString()} active users`);
    console.log(`🛒 Normal Shopping Day:         ~${avgUser.toLocaleString()} active users`);
    console.log(`👀 Light Browsing:              ~${lightUser.toLocaleString()} active users`);
    console.log('============================================');
    console.log(`\n📝 NOTE: These numbers are for your LOCAL machine.`);
    console.log(`   Production servers (Vercel/AWS) will be 10x-50x higher.`);
});

autocannon.track(instance, { renderProgressBar: true });
