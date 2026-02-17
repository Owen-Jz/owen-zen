
import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(req: Request) {
    try {
        const { content, imageUrl } = await req.json();

        if (!process.env.TWITTER_API_KEY ||
            !process.env.TWITTER_API_SECRET ||
            !process.env.TWITTER_ACCESS_TOKEN ||
            !process.env.TWITTER_ACCESS_SECRET) {
            return NextResponse.json({ success: false, error: 'Twitter API keys not configured in .env.local' }, { status: 500 });
        }

        const client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET,
        });

        let mediaId;
        if (imageUrl) {
            try {
                // Fetch the image from URL
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) throw new Error("Failed to fetch image");

                const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

                // Upload media (v1.1 endpoint is required for media upload currently)
                mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: 'image/jpeg' }); // Default to jpeg, twitter handles conversion
            } catch (mediaError) {
                console.error("Media upload failed:", mediaError);
                return NextResponse.json({ success: false, error: 'Failed to upload image to Twitter' }, { status: 500 });
            }
        }

        const tweetPayload: any = { text: content };
        if (mediaId) {
            tweetPayload.media = { media_ids: [mediaId] };
        }

        const tweet = await client.v2.tweet(tweetPayload);

        return NextResponse.json({ success: true, data: tweet });

    } catch (error: any) {
        console.error('Twitter API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to post to Twitter' }, { status: 500 });
    }
}
