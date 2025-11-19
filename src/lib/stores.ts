import { writable } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';

// UI State
export const sidebarState = writable<'open' | 'closed'>('open'); // For mobile mostly, or collapsible
export const selectedFeedId = writable<number | 'all' | 'starred' | null>('all');
export const selectedArticleId = writable<number | null>(null);

// Global Search/Filter
export const searchQuery = writable<string>('');

// Settings Store (Synced with LocalStorage for immediate UI prefs, DB for deeper config)
export const userSettings = localStorageStore('vesper-settings', {
    theme: 'vesper',
    proxyUrl: 'https://api.allorigins.win/raw?url=', // Default proxy
    refreshInterval: 15, // minutes
    showRead: false, // show read articles
    layout: '3-panel' as '3-panel' | 'list-only',
    fontSize: 18,
});
