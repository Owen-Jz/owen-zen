const mongoose = require('mongoose');

async function test() {
    try {
        console.log('testing setting family 4...');
        await mongoose.connect('mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority', {
            serverSelectionTimeoutMS: 5000,
            family: 4
        });
        console.log('Connected with family 4!');
        await mongoose.disconnect();
    } catch (e) {
        console.error('family 4 error:', e.message);
    }
}

test();
