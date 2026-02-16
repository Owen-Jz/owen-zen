import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function populate() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const boardSchema = new mongoose.Schema({ title: String }, { timestamps: true });
        const taskSchema = new mongoose.Schema({
            title: String,
            status: { type: String, default: 'pending' },
            priority: { type: String, default: 'medium' },
            boardId: mongoose.Schema.Types.ObjectId,
            isMIT: { type: Boolean, default: false }
        }, { timestamps: true });

        const Board = mongoose.models.Board || mongoose.model('Board', boardSchema);
        const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

        // 1. Create Financial Freedom Board
        const board = await Board.create({ title: 'Financial Freedom' });
        console.log('✅ Created Board:', board.title);

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
            await Task.create({
                ...t,
                boardId: board._id
            });
        }
        console.log('✅ Successfully populated Financial Freedom board!');

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

populate();
