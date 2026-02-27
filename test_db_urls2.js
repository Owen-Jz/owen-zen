const mongoose = require('mongoose');
const dns = require('dns');

async function test() {
    try {
        console.log('testing setting dns...');
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        await mongoose.connect('mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority', { serverSelectionTimeoutMS: 5000 });
        console.log('Connected with dns set!');
        await mongoose.disconnect();
    } catch (e) {
        console.error('dns error:', e.message);
    }
}

test();
