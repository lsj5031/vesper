import { db } from './db';

export async function exportBackup() {
    const data = {
        version: 1,
        timestamp: Date.now(),
        feeds: await db.feeds.toArray(),
        folders: await db.folders.toArray(),
        articles: await db.articles.toArray(),
        settings: await db.settings.toArray()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vesper-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export async function importBackup(file: File) {
    const text = await file.text();
    const data = JSON.parse(text);

    // Basic validation
    if (!data.feeds || !data.articles) throw new Error('Invalid backup file');

    await db.transaction('rw', db.feeds, db.folders, db.articles, db.settings, async () => {
        // Clear existing data to prevent conflicts
        await db.feeds.clear();
        await db.folders.clear();
        await db.articles.clear();
        await db.settings.clear();

        // Bulk add new data
        if (data.feeds.length) await db.feeds.bulkAdd(data.feeds);
        if (data.folders.length) await db.folders.bulkAdd(data.folders);
        if (data.articles.length) await db.articles.bulkAdd(data.articles);
        if (data.settings.length) await db.settings.bulkAdd(data.settings);
    });
}
