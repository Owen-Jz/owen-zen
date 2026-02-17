
import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Integration from "@/models/Integration";

export async function POST(req: Request) {
    try {
        const { content, imageUrl } = await req.json();

        // Fetch Access Token from DB
        await dbConnect();
        const integration = await Integration.findOne({ provider: 'linkedin' });

        if (!integration || !integration.accessToken) {
            return NextResponse.json({ success: false, error: 'LinkedIn not connected. Please connect in settings.' }, { status: 400 });
        }

        // Prepare Payload
        // LinkedIn API v2 for posting
        // Endpoint: https://api.linkedin.com/v2/ugcPosts
        // Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

        const authorUrn = `urn:li:person:${integration.profileId}`; // URN format

        let mediaAsset;
        // Note: Image upload to LinkedIn is complex (initialize, upload, finalize). 
        // Usually simpler to share a URL if possible, but for binary upload:
        // We would skip full binary implementation for this MVP unless requested.
        // Instead, we can attach the media as a Link if it's a URL, or text-only if no URL.

        // Simplification: For now, if imageUrl is present, treat it as an article share or ignore if not supported easily
        // Actually, let's stick to text-only for V1 or link sharing.

        const postBody = {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: imageUrl ? "ARTICLE" : "NONE",
                    media: imageUrl ? [
                        {
                            status: "READY",
                            description: { text: "Link" },
                            originalUrl: imageUrl // Assuming it's a public URL (e.g. cloudinary)
                        }
                    ] : undefined
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        };

        const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${integration.accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postBody)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || JSON.stringify(data));
        }

        return NextResponse.json({ success: true, data: data });

    } catch (error: any) {
        console.error('LinkedIn API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to post to LinkedIn' }, { status: 500 });
    }
}
