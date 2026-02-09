const { MongoClient } = require('mongodb');
const dns = require('dns');

// Fix for SRV lookup issues on some Windows environments
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn('Failed to set custom DNS servers:', e);
}

const uri = "mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority";

async function listCollections() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected correctly to server');

        const db = client.db(); // This will use the default database from the URI, or 'test' if none.
        console.log(`Using database: ${db.databaseName}`);

        // List all databases
        const dbs = await client.db().admin().listDatabases();
        console.log('All Databases and Collections on Cluster:');

        for (const dbInfo of dbs.databases) {
            console.log(`\nDatabase: ${dbInfo.name}`);
            const dbInstance = client.db(dbInfo.name);
            const collections = await dbInstance.listCollections().toArray();
            if (collections.length === 0) {
                console.log('  (No collections)');
            } else {
                collections.forEach(col => console.log(`  - ${col.name}`));
            }
        }

    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    } finally {
        await client.close();
    }
}

listCollections();
