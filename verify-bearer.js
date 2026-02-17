
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim();
        }
    });
}

async function verifyBearer() {
    console.log("Testing Bearer Token...");
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

    try {
        // Try to fetch a public user (e.g., TwitterDev)
        const user = await client.v2.userByUsername('TwitterDev');
        console.log("Bearer Token is VALID. Found user:", user.data.username);
    } catch (error) {
        console.error("Bearer Token invalid:", error.message);
    }
}

verifyBearer();
