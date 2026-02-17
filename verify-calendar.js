const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { google } = require('googleapis');

// Manually Load .env.local (since dotenv is not installed)
try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.warn("Could not load .env.local manually", e);
}

// Schema Definition (Inline to avoid TS issues)
const TaskSchema = new mongoose.Schema({
    title: String,
    status: String,
    priority: String,
    scheduledDate: Date,
    googleEventId: String,
});
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function testSync() {
    console.log("1. Connecting to MongoDB...");
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI missing in .env.local");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    // 2. Create/Find a Test Task
    console.log("2. Creating Test Task...");
    const task = await Task.create({
        title: "Test Sync Task - " + new Date().toISOString(),
        status: "pending",
        priority: "high"
    });
    console.log(`✅ Created Task: ${task.title} (${task._id})`);

    // 3. Authenticate Google
    console.log("3. Authenticating Google Calendar...");
    try {
        const keyFilePath = path.join(process.cwd(), 'service_account.json');
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        const calendar = google.calendar({ version: 'v3', auth });

        // 4. Insert Event
        console.log("4. Attempting to Insert Event...");
        const startDate = new Date();
        startDate.setHours(startDate.getHours() + 24); // Tomorrow
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);

        const event = {
            summary: `🎯 TEST: ${task.title}`,
            description: `This is a test event from the verification script.`,
            start: { dateTime: startDate.toISOString(), timeZone: 'Africa/Lagos' },
            end: { dateTime: endDate.toISOString(), timeZone: 'Africa/Lagos' },
        };

        const res = await calendar.events.insert({
            calendarId: 'owendigitals@gmail.com', // Target Calendar
            requestBody: event,
        });

        console.log("✅ Event Created Successfully!");
        console.log(`🔗 Link: ${res.data.htmlLink}`);

        // Cleanup
        await Task.findByIdAndDelete(task._id);
        console.log("🧹 Test Task Cleaned up");

    } catch (error) {
        console.error("❌ Google Calendar Sync Failed:");
        console.error(error.message);

        if (error.code === 404 || error.message.includes('Not Found')) {
            console.log("\n⚠️  POSSIBLE CAUSE: The calendar ID 'owendigitals@gmail.com' might not be valid, or the Service Account does not have access.");
            console.log("👉 Make sure you shared 'owendigitals@gmail.com' with: derek-agent@gen-lang-client-0609579248.iam.gserviceaccount.com");
        }
    } finally {
        await mongoose.disconnect();
    }
}

testSync();
