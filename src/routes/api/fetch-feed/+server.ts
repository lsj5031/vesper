import { error as httpError } from '@sveltejs/kit';
import Parser from 'rss-parser';
import type { RequestHandler } from './$types';

// Some feeds ship malformed XML (unclosed CDATA, `<link/>http...` fragments, etc.)
// This lightly normalizes common cases so the parser can recover.
function cleanupMalformedXml(xml: string): string {
    let cleaned = xml.replace(/<(link|guid)\s*\/>\s*(https?:\/\/[^\s<]+)/gi, '<$1>$2</$1>');
    cleaned = cleaned.replace(/\]\]\s*>/g, ']]>'); // normalize spaced CDATA endings

    const openCdata = (cleaned.match(/<!\[CDATA\[/g) || []).length;
    const closeCdata = (cleaned.match(/\]\]>/g) || []).length;
    if (openCdata > closeCdata) {
        cleaned += ']]>'.repeat(openCdata - closeCdata);
    }

    return cleaned;
}

const parser = new Parser({
    customFields: {
        item: ['media:content', 'media:thumbnail', 'content:encoded', 'dc:creator'],
    },
    defaultRSS: 2.0,
    xml2js: {
        resolveNamespace: true
    }
});

export const GET: RequestHandler = async ({ url }) => {
    const feedUrl = url.searchParams.get('url');
    const refresh = url.searchParams.get('refresh') === 'true';
    
    if (!feedUrl) {
        return httpError(400, 'Missing url parameter');
    }
    
    try {
        const response = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.9',
                ...(refresh ? { 'Cache-Control': 'no-cache' } : {})
            },
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
            return httpError(response.status, `Feed returned ${response.status}`);
        }
        
        const text = await response.text();
        let feedData;
        try {
            feedData = await parser.parseString(cleanupMalformedXml(text));
        } catch (parseErr: any) {
            console.error(`Parse error for ${feedUrl}:`, parseErr);
            return httpError(502, `Failed to parse feed: ${parseErr.message}`);
        }
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };

        if (!refresh) {
            headers['Cache-Control'] = 'max-age=3600';
        } else {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        }

        return new Response(JSON.stringify(feedData), { headers });
    } catch (err: any) {
        console.error(`Failed to fetch feed ${feedUrl}:`, err.message);
        
        if (err.name === 'AbortError') {
            return httpError(504, `Feed request timeout after 10 seconds`);
        }
        
        return httpError(502, `Failed to fetch feed: ${err.message}`);
    }
};
