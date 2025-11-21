// Cloudflare Pages Function to proxy RSS/Atom feeds (bypasses CORS for the SPA)
export const onRequest: PagesFunction = async ({ request }) => {
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('url');
    const refresh = url.searchParams.get('refresh') === 'true';

    if (!feedUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    try {
        const response = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.9',
                ...(refresh ? { 'Cache-Control': 'no-cache' } : {})
            },
            // Abort if upstream hangs
            signal: AbortSignal.timeout(10000),
            // Edge cache for an hour unless force-refreshing
            cf: refresh ? { cacheTtl: 0, cacheEverything: false } : { cacheTtl: 3600, cacheEverything: true }
        });

        if (!response.ok) {
            return new Response(`Feed returned ${response.status}`, { status: response.status });
        }

        const text = await response.text();
        const headers: Record<string, string> = {
            'Content-Type': 'application/xml; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            ...(refresh ? { 'Cache-Control': 'no-cache, no-store, must-revalidate' } : { 'Cache-Control': 'max-age=3600' })
        };

        return new Response(text, { status: 200, headers });
    } catch (err: any) {
        console.error(`Failed to fetch feed ${feedUrl}:`, err?.message || err);

        if (err?.name === 'AbortError') {
            return new Response('Feed request timeout after 10 seconds', { status: 504 });
        }

        return new Response(`Failed to fetch feed: ${err?.message || 'unknown error'}`, { status: 502 });
    }
};
