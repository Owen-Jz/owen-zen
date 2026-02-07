import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://owendigitals:BWOXQWQnP1v4QJdY@owen-zen.e4hxc.mongodb.net/owen-zen?retryWrites=true&w=majority&appName=owen-zen';

async function addTask() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('owen-zen');
    const tasks = db.collection('tasks');
    
    const task = {
      title: "Set up payment methods for remote work",
      status: "pinned",
      priority: "high",
      subtasks: [
        { title: "Open Wise account (primary - wise.com, needs BVN + ID)", completed: false },
        { title: "Get Barter virtual dollar card (Flutterwave app)", completed: false },
        { title: "Verify GTBank/UBA has dollar account enabled", completed: false },
        { title: "Create Payoneer account (backup for Wise)", completed: false },
        { title: "Download Chipper Cash (virtual card + P2P)", completed: false },
        { title: "Research Stripe Atlas ($500) - only if revenue >$2k/mo", completed: false },
        { title: "Set up Binance P2P (emergency USD→NGN backup)", completed: false }
      ],
      isArchived: false,
      createdAt: new Date()
    };
    
    const result = await tasks.insertOne(task);
    console.log('✅ Task added to Pin for Later! ID:', result.insertedId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

addTask();
