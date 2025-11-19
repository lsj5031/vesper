import { db } from './db';
import { addNewFeed } from './rss';

export async function importOPML(file: File) {
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const body = xml.querySelector('body');
    if (!body) throw new Error('Invalid OPML');

    const processOutline = async (node: Element, parentFolderId?: number) => {
        const type = node.getAttribute('type');
        const xmlUrl = node.getAttribute('xmlUrl');
        const textAttr = node.getAttribute('text') || node.getAttribute('title');

        if (xmlUrl) {
            // It's a feed
            try {
                // Check if exists
                const existing = await db.feeds.where('url').equals(xmlUrl).first();
                if (!existing) {
                    await db.feeds.add({
                        url: xmlUrl,
                        title: textAttr || 'Untitled',
                        website: node.getAttribute('htmlUrl') || '',
                        folderId: parentFolderId
                    });
                }
            } catch (e) {
                console.error('Failed to import feed', xmlUrl, e);
            }
        } else if (node.querySelectorAll('outline').length > 0) {
            // It's likely a folder
            let folderId = parentFolderId;
            if (textAttr) {
                // Create folder
                const existingFolder = await db.folders.where('name').equals(textAttr).first();
                if (existingFolder) {
                    folderId = existingFolder.id;
                } else {
                    folderId = await db.folders.add({ name: textAttr });
                }
            }
            
            // Process children
            for (const child of Array.from(node.children)) {
                if (child.tagName.toLowerCase() === 'outline') {
                    await processOutline(child, folderId);
                }
            }
        }
    };

    const outlines = body.children;
    for (const node of Array.from(outlines)) {
        if (node.tagName.toLowerCase() === 'outline') {
            await processOutline(node);
        }
    }
}

export async function exportOPML() {
    const feeds = await db.feeds.toArray();
    const folders = await db.folders.toArray();
    
    let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Vesper Subscriptions</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>`;

    // 1. Process Folders
    for (const folder of folders) {
        opml += `\n    <outline text="${folder.name}" title="${folder.name}">`;
        const folderFeeds = feeds.filter(f => f.folderId === folder.id);
        for (const feed of folderFeeds) {
             opml += `\n      <outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" htmlUrl="${feed.website}"/>`;
        }
        opml += `\n    </outline>`;
    }

    // 2. Process Uncategorized
    const uncategorized = feeds.filter(f => !f.folderId);
    for (const feed of uncategorized) {
        opml += `\n    <outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" htmlUrl="${feed.website}"/>`;
    }

    opml += `\n  </body>\n</opml>`;
    
    const blob = new Blob([opml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vesper-subs.opml';
    a.click();
}
