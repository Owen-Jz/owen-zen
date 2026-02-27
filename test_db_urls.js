const mongoose = require('mongoose');

async function test() {
    try {
        console.log('testing .env.local URI...');
        await mongoose.connect('mongodb://new_owen_user:0lLdhFMmLK582IDp@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/owen-zen?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority', { serverSelectionTimeoutMS: 5000 });
        console.log('Connected .env.local!');
        await mongoose.disconnect();
    } catch (e) {
        console.error('.env.local error:', e.message);
    }

    try {
        console.log('testing env.local URI...');
        await mongoose.connect('mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority', { serverSelectionTimeoutMS: 5000 });
        console.log('Connected env.local!');
        await mongoose.disconnect();
    } catch (e) {
        console.error('env.local error:', e.message);
    }
}

test();
