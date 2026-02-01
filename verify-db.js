const mongoose = require('mongoose');
const dns = require('dns');

// Try setting Google DNS
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('Set custom DNS servers.');
} catch (e) {
    console.log('Could not set custom DNS:', e.message);
}

const uri = "mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority";
console.log('Testing connection with custom DNS...');

async function test() {
    try {
        console.log('Connecting...');
        await mongoose.connect(uri);
        console.log('Connected successfully!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Connection failed details:', err);
    }
}

test();
