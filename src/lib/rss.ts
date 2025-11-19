import Parser from 'rss-parser';
import DOMPurify from 'dompurify';
import { db, type Feed, type Article } from './db';
import { tokenize } from './search';
import { refreshProgress } from './stores';


// Initialize Parser
const parser = new Parser({
    customFields: {
        item: ['media:content', 'media:thumbnail', 'content:encoded', 'dc:creator'],
    }
});

// Initialize DOMPurify (needs window context, so check for browser)
let sanitize = (html: string) => html;
if (typeof window !== 'undefined') {
    sanitize = (html: string) => DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'img', 'h1', 'h2', 'h3', 'h4', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target']
    });
}

export async function fetchFeed(url: string, maxRetries = 2, forceRefresh = false) {
    // Use backend proxy endpoint to avoid CORS issues
    let proxyUrl = `/api/fetch-feed?url=${encodeURIComponent(url)}`;
    if (forceRefresh) {
        proxyUrl += '&refresh=true';
    }
    
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const text = await response.text();
            const feedData = await parser.parseString(text);
            
            return feedData;
        } catch (e) {
            lastError = e;
            // Only retry on network errors, not on parse errors
            if (attempt < maxRetries && (e instanceof TypeError || (e as any).message?.includes('HTTP'))) {
                await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))); // Exponential backoff
                continue;
            }
            break;
        }
    }
    
    console.error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`, lastError);
    throw lastError;
}

export async function syncFeed(feed: Feed, unreadLimit = 50, forceRefresh = false) {
    try {
        const data = await fetchFeed(feed.url, 2, forceRefresh);
        
        // Update Feed Metadata
        await db.feeds.update(feed.id!, {
            title: feed.title || data.title || 'Unknown Feed',
            lastFetched: Date.now(),
            error: undefined
        });

        // Process all articles (convert to Article objects first)
        const processedArticles: Article[] = data.items.map(item => {
            const contentRaw = item['content:encoded'] || item.content || item.summary || '';
            const cleanContent = sanitize(contentRaw);
            
            return {
                feedId: feed.id!,
                guid: item.guid || item.link || item.title || Math.random().toString(),
                title: item.title || 'Untitled',
                link: item.link || '',
                content: cleanContent,
                snippet: cleanContent.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
                author: item.creator || item['dc:creator'],
                isoDate: item.isoDate || new Date().toISOString(),
                receivedDate: Date.now(),
                read: 0,
                starred: 0,
                words: tokenize(`${item.title || ''} ${cleanContent}`)
            };
        });

        // Efficiently filter for NEW articles (check keys only)
        // This avoids loading full article content for entire history
        const incomingGuids = processedArticles.map(a => a.guid);
        
        // Find which of these GUIDs already exist for this feed
        const existingGuidsSet = new Set<string>();
        
        // Use the compound index to find matching records but only select the 'guid' field.
        const existingRecords = await db.articles
            .where('[feedId+guid]')
            .anyOf(incomingGuids.map(g => [feed.id!, g]))
            .toArray();
            
        existingRecords.forEach(r => existingGuidsSet.add(r.guid));

        const newArticles = processedArticles.filter(
            a => !existingGuidsSet.has(a.guid)
        );

        // Auto-Archive Strategy:
        // 1. Sort by date (newest first)
        // 2. Top 50: Mark as unread (visible in inbox)
        // 3. Rest: Mark as read (auto-archived)
        const articlesSortedByDate = newArticles.sort((a, b) => {
            const dateA = new Date(a.isoDate).getTime();
            const dateB = new Date(b.isoDate).getTime();
            return dateB - dateA; // Newest first
        });

        const unreadArticles = articlesSortedByDate
            .slice(0, unreadLimit)
            .map(a => ({ ...a, read: 0 as const })); // Mark as unread

        const archivedArticles = articlesSortedByDate
            .slice(unreadLimit)
            .map(a => ({ ...a, read: 1 as const })); // Mark as read (auto-archived)

        const allNewArticles = [...unreadArticles, ...archivedArticles];

        // Bulk insert (optimized for large batches)
        if (allNewArticles.length > 0) {
            await db.articles.bulkAdd(allNewArticles);
        }

        return {
            unread: unreadArticles.length,
            archived: archivedArticles.length,
            total: allNewArticles.length
        };
    } catch (err: any) {
        await db.feeds.update(feed.id!, { error: err.message });
        throw err;
    }
}

export async function addNewFeed(url: string, folderId?: number) {
    // 1. Fetch first to validate
    const data = await fetchFeed(url);
    
    // 2. Add to DB
    const feedId = await db.feeds.add({
        url,
        title: data.title || new URL(url).hostname,
        website: data.link || url,
        folderId,
        lastFetched: 0 // Trigger sync immediately after
    });

    // 3. Sync content
    const feed = await db.feeds.get(feedId);
    if (feed) await syncFeed(feed);
    
    return feedId;
}

export async function refreshAllFeeds() {
    const feeds = await db.feeds.toArray();
    const concurrency = 3;
    const results: PromiseSettledResult<{ unread: number; archived: number; total: number }>[] = [];
    
    try {
        // Queue-based concurrency control
        const queue = [...feeds];
        let completed = 0;
        
        refreshProgress.set({ completed: 0, total: feeds.length });
        
        const worker = async () => {
            while (queue.length > 0) {
                const feed = queue.shift();
                if (!feed) return;
                
                try {
                    const result = await syncFeed(feed);
                    results.push({ status: 'fulfilled', value: result });
                } catch (err) {
                    results.push({ status: 'rejected', reason: err });
                }
                
                completed++;
                refreshProgress.set({ completed, total: feeds.length });
            }
        };
        
        // Start concurrency workers
        const workers = Array(Math.min(concurrency, feeds.length))
            .fill(null)
            .map(() => worker());
        
        await Promise.all(workers);
        return results;
    } finally {
        refreshProgress.set(null);
    }
}
