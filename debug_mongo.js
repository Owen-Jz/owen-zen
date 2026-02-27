const mongoose = require('mongoose');
const fs = require('fs');

const uris = [
    { name: 'ENV_LOCAL_LONG', uri: 'mongodb://new_owen_user:0lLdhFMmLK582IDp@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/owen-zen?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority' },
    { name: 'SRV_CLUSTER0', uri: 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority' }
];

async function runTests() {
    let log = '';
    for (const item of uris) {
        log += `\nTesting ${item.name}...\n`;
        try {
            await mongoose.connect(item.uri, { serverSelectionTimeoutMS: 5000 });
            log += `✅ ${item.name} connected!\n`;
            await mongoose.disconnect();
        } catch (e) {
            log += `❌ ${item.name} failed: ${e.message}\n`;
            if (e.reason) {
                log += `   Reason: ${JSON.stringify(e.reason)}\n`;
            }
        }
    }
    fs.writeFileSync('db_debug_results.txt', log);
    console.log('Results written to db_debug_results.txt');
    process.exit(0);
}

runTests();
