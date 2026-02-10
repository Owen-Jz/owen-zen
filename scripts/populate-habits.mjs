import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function populate() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const habitSchema = new mongoose.Schema({
            title: String,
            description: String,
            category: String,
            streak: Number,
            completedDates: [Date],
            createdAt: Date
        });

        const Habit = mongoose.models.Habit || mongoose.model('Habit', habitSchema);

        const habits = [
            { 
              title: "Wake Up at Fixed Time", 
              category: "mindset",
              description: "Pick a time (e.g. 6:00am). No snoozing. Brain loves predictability. Control wake-up = control life.",
              streak: 0, completedDates: [], createdAt: new Date()
            },
            { 
              title: "Move Your Body (Daily)", 
              category: "health",
              description: "Gym, walk, or jog. Gym days: train hard. Non-gym days: 7–10k steps. Stagnant body = lazy mind.",
              streak: 0, completedDates: [], createdAt: new Date()
            },
            { 
              title: "Eat Simple Meals", 
              category: "health",
              description: "High protein, simple carbs, controlled fats. No emotional eating. If food is chaotic, focus is chaotic.",
              streak: 0, completedDates: [], createdAt: new Date()
            },
            { 
              title: "3–4 Hours Deep Work", 
              category: "work",
              description: "Phone on DND. One task, one outcome. Focus for 3 hours or forget scaling.",
              streak: 0, completedDates: [], createdAt: new Date()
            },
            { 
              title: "One Money-Moving Action", 
              category: "work",
              description: "Lead outreach, improve sales page, send proposal, ship feature, or close follow-up.",
              streak: 0, completedDates: [], createdAt: new Date()
            },
            { 
              title: "Track Inputs (Truth)", 
              category: "work",
              description: "Did I train? Eat properly? Deep work? Move money forward? Just truth on paper, no fluff.",
              streak: 0, completedDates: [], createdAt: new Date()
            },
            { 
              title: "Control Dopamine", 
              category: "mindset",
              description: "No porn, no scrolling, no 'rewarding' for nothing. Earn motivation through effort.",
              streak: 0, completedDates: [], createdAt: new Date()
            },
            { 
              title: "Sleep at Fixed Time", 
              category: "health",
              description: "Same bedtime. Screens off 60m before. Sleep is discipline, not laziness. Tired = stupid decisions.",
              streak: 0, completedDates: [], createdAt: new Date()
            }
        ];

        for (const h of habits) {
            const exists = await Habit.findOne({ title: h.title });
            if (!exists) {
                await Habit.create(h);
                console.log('✅ Created Habit:', h.title);
            } else {
                exists.description = h.description;
                await exists.save();
                console.log('🔄 Updated Habit:', h.title);
            }
        }
        
        console.log('✅ Successfully integrated habits!');
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

populate();
