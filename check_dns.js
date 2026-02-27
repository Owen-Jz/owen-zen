const dns = require('dns');
const fs = require('fs');

const hosts = [
    'ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net',
    'ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net',
    'ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net',
    'cluster0.zvxia6f.mongodb.net',
    'google.com'
];

async function check() {
    let output = '';
    for (const host of hosts) {
        try {
            const result = await new Promise((resolve, reject) => {
                dns.lookup(host, (err, address, family) => {
                    if (err) reject(err);
                    else resolve({ address, family });
                });
            });
            output += `Success: ${host} -> ${result.address} (IPv${result.family})\n`;
        } catch (e) {
            output += `Error: ${host} -> ${e.message}\n`;
        }
    }
    fs.writeFileSync('dns_results.txt', output);
    console.log('Results written to dns_results.txt');
}

check();
