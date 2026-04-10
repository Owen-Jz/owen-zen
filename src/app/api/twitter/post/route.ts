
import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

const FETCH_TIMEOUT = 30000;

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

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
                const imageResponse = await fetchWithTimeout(imageUrl);
                if (!imageResponse.ok) throw new Error("Failed to fetch image");

                const arrayBuffer = await imageResponse.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);

                // Get mime type from response headers or infer from URL
                const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
                // Twitter requires specific mime types (image/jpeg, image/png, image/gif, image/webp)

                // Upload media (v1.1 endpoint is required for media upload currently)
                mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType });
            } catch (mediaError: any) {
                if (mediaError.name === 'AbortError') {
                    console.error("Image fetch timed out");
                    return NextResponse.json({
                        success: false,
                        error: 'Image fetch timed out. Please try again.'
                    }, { status: 504 });
                }
                console.error("Media upload failed:", mediaError);
                // Return detailed error if possible
                return NextResponse.json({
                    success: false,
                    error: 'Failed to upload image to Twitter: ' + (mediaError.message || 'Unknown error')
                }, { status: 500 });
            }
        }

        const tweetPayload: any = { text: content };
        if (mediaId) {
            tweetPayload.media = { media_ids: [mediaId] };
        }

        const tweet = await client.v2.tweet(tweetPayload);

        return NextResponse.json({ success: true, data: tweet });

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error('Twitter API request timed out');
            return NextResponse.json({ success: false, error: 'Request timed out. Please try again.' }, { status: 504 });
        }
        console.error('Twitter API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to post to Twitter' }, { status: 500 });
    }
}
