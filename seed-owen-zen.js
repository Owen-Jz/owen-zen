const { MongoClient } = require('mongodb');
const dns = require('dns');

// Fix for SRV lookup issues on some Windows environments
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn('Failed to set custom DNS servers:', e);
}

const uri = "mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/owen-zen?retryWrites=true&w=majority";

async function seedTasks() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to owen-zen database');

        const db = client.db('owen-zen');
        const tasksCollection = db.collection('tasks');

        const initialTasks = [
            {
                title: "Complete Owen-Zen Project Setup",
                status: "in-progress",
                priority: "high",
                order: 0,
                isArchived: false,
                createdAt: new Date(),
                subtasks: [
                    { title: "Initialize Next.js 15 project", completed: true },
                    { title: "Configure MongoDB connection", completed: true },
                    { title: "Set up Task models", completed: true }
                ],
                timeLogs: [],
                totalTimeSpent: 0
            },
            {
                title: "Design Elite Light Mode UI",
                status: "pending",
                priority: "medium",
                order: 1,
                isArchived: false,
                createdAt: new Date(),
                subtasks: [
                    { title: "Create color palette", completed: false },
                    { title: "Design Kanban board", completed: false }
                ],
                timeLogs: [],
                totalTimeSpent: 0
            },
            {
                title: "Implement Multi-Board Support",
                status: "pending",
                priority: "high",
                order: 2,
                isArchived: false,
                createdAt: new Date(),
                subtasks: [],
                timeLogs: [],
                totalTimeSpent: 0
            }
        ];

        const result = await tasksCollection.insertMany(initialTasks);
        console.log(`${result.insertedCount} initial tasks added to owen-zen database.`);

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.close();
    }
}

seedTasks();
