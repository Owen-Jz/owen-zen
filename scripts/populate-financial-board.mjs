import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function populate() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        // Use owen-zen database specifically if possible, but URI has no DB name in path
        // It seems the flux-local scripts defined schemas with strict indexes on "boards" collection
        // Owen-zen seems to share the same cluster/db maybe? Or I need to be careful with schema definitions.
        // The error shows "duplicate key error collection: test.boards".
        // It seems mongoose defaults to 'test' db if not specified in URI path.
        
        // Let's connect to 'owen-zen' specifically.
        const db = mongoose.connection.useDb('owen-zen');
        
        const boardSchema = new mongoose.Schema({ title: String }, { timestamps: true });
        // Make sure we don't conflict with Flux schema if sharing DB
        
        const Board = db.model('Board', boardSchema);
        
        // Create Financial Freedom Board
        // Check if exists first
        let board = await Board.findOne({ title: 'Financial Freedom' });
        
        if (!board) {
            board = await Board.create({ title: 'Financial Freedom' });
            console.log('✅ Created Board:', board.title);
        } else {
            console.log('ℹ️ Board already exists:', board._id);
        }

        const taskSchema = new mongoose.Schema({
            title: String,
            status: { type: String, default: 'pending' },
            priority: { type: String, default: 'medium' },
            boardId: mongoose.Schema.Types.ObjectId,
            isMIT: { type: Boolean, default: false }
        }, { timestamps: true });

        const Task = db.model('Task', taskSchema);

        const tasks = [
            {
                title: 'Build Emergency Fund ($12k)',
                priority: 'high',
                isMIT: true
            },
            {
                title: 'Secure 3 Consecutive Months of $5k Income',
                priority: 'high',
                isMIT: false
            },
            {
                title: 'Review Debt Obligations',
                priority: 'medium',
                isMIT: false
            },
            {
                title: 'Audit Monthly Recurring Expenses',
                priority: 'medium',
                isMIT: false
            },
            {
                title: 'Setup Automated Savings Transfer',
                priority: 'high',
                isMIT: false
            },
            {
                title: 'Define 2026 Investment Strategy',
                priority: 'low',
                isMIT: false
            }
        ];

        for (const t of tasks) {
            // Check dupes
            const exists = await Task.findOne({ title: t.title, boardId: board._id });
            if (!exists) {
                await Task.create({
                    ...t,
                    boardId: board._id
                });
                console.log(`+ Task: ${t.title}`);
            }
        }
        console.log('✅ Successfully populated Financial Freedom board!');

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

populate();
