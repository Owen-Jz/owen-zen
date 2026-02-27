const net = require('net');

const hosts = [
    { host: 'ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net', port: 27017 },
    { host: 'ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net', port: 27017 },
    { host: 'ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net', port: 27017 }
];

function test(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);

        socket.on('connect', () => {
            console.log(`✅ ${host}:${port} is reachable!`);
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            console.log(`❌ ${host}:${port} timeout!`);
            socket.destroy();
            resolve(false);
        });

        socket.on('error', (err) => {
            console.log(`❌ ${host}:${port} error: ${err.message}`);
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function run() {
    console.log('Testing raw TCP connectivity to MongoDB Atlas ports...');
    for (const item of hosts) {
        await test(item.host, item.port);
    }
}

run();
