<script lang="ts">
    import { liveQuery } from 'dexie';
    import { db } from '../db';
    import { selectedFeedId, selectedArticleId } from '../stores';
    import { importOPML, exportOPML } from '../opml';
    import { addNewFeed, refreshAllFeeds } from '../rss';
    
    // Live Queries
    const folders = liveQuery(() => db.folders.toArray());
    const feeds = liveQuery(() => db.feeds.toArray());
    
    // Derived state (naive grouping for simple template)
    $: feedsList = $feeds || [];
    $: foldersList = $folders || [];
    
    let newFeedUrl = '';
    let isImporting = false;
    
    async function handleAddFeed() {
        if (!newFeedUrl) return;
        try {
            await addNewFeed(newFeedUrl);
            newFeedUrl = '';
        } catch (e) {
            alert('Failed to add feed');
        }
    }
    
    function handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.length) {
            importOPML(input.files[0]).then(() => alert('Imported!'));
        }
    }

    function selectFeed(id: number | undefined) {
        if (id !== undefined) $selectedFeedId = id;
    }
</script>

<div class="h-full flex flex-col bg-vesper-dark border-r border-vesper-midgray">
    <!-- Header -->
    <div class="p-4 border-b border-vesper-midgray">
        <h1 class="text-2xl font-headline font-bold text-white tracking-tight mb-1">Vesper</h1>
        <p class="text-xs text-vesper-lightgray uppercase tracking-widest">Where the day settles</p>
    </div>

    <!-- Controls -->
    <div class="p-4 space-y-2 border-b border-vesper-midgray">
        <div class="flex gap-2">
            <input 
                type="text" 
                bind:value={newFeedUrl} 
                placeholder="Feed URL..." 
                class="input bg-vesper-charcoal border-none text-sm h-8 rounded-none placeholder-gray-500 focus:ring-1 focus:ring-vesper-ftPink w-full"
                on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && handleAddFeed()}
            />
            <button class="btn btn-sm variant-filled-primary rounded-none font-bold text-xs" on:click={handleAddFeed}>+</button>
        </div>
        <div class="flex justify-between text-[10px] text-vesper-lightgray uppercase tracking-wider font-bold">
            <button class="hover:text-white" on:click={() => document.getElementById('opmlInput')?.click()}>Import OPML</button>
            <button class="hover:text-white" on:click={exportOPML}>Export</button>
            <input type="file" id="opmlInput" class="hidden" on:change={handleFileSelect} accept=".opml,.xml" />
        </div>
        <button class="w-full text-[10px] bg-vesper-charcoal hover:bg-vesper-midgray py-1 text-vesper-salmon" on:click={refreshAllFeeds}>
            Refresh All
        </button>
    </div>

    <!-- Feeds List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-4">
        <!-- Special Filters -->
        <div class="space-y-0.5">
            <button 
                class="w-full text-left px-3 py-1.5 text-sm font-medium {$selectedFeedId === 'all' ? 'text-vesper-ftPink bg-vesper-charcoal' : 'text-gray-300 hover:bg-vesper-charcoal/50'}"
                on:click={() => $selectedFeedId = 'all'}
            >
                All Articles
            </button>
            <button 
                class="w-full text-left px-3 py-1.5 text-sm font-medium {$selectedFeedId === 'starred' ? 'text-vesper-ftPink bg-vesper-charcoal' : 'text-gray-300 hover:bg-vesper-charcoal/50'}"
                on:click={() => $selectedFeedId = 'starred'}
            >
                Starred
            </button>
        </div>

        <div class="divider-h border-vesper-charcoal my-2"></div>

        <!-- Folders -->
        {#each foldersList as folder}
            <div class="space-y-0.5">
                <div class="px-3 py-1 text-xs font-bold text-vesper-lightgray uppercase tracking-wider">
                    {folder.name}
                </div>
                {#each feedsList.filter(f => f.folderId === folder.id) as feed}
                    <button 
                        class="w-full text-left px-3 py-1.5 text-sm truncate {$selectedFeedId === feed.id ? 'text-white bg-vesper-charcoal border-l-2 border-vesper-ftPink' : 'text-gray-400 hover:text-white'}"
                        on:click={() => selectFeed(feed.id)}
                    >
                        {feed.title}
                    </button>
                {/each}
            </div>
        {/each}

        <!-- Uncategorized -->
        <div class="space-y-0.5">
            <div class="px-3 py-1 text-xs font-bold text-vesper-lightgray uppercase tracking-wider">
                Feeds
            </div>
            {#each feedsList.filter(f => !f.folderId) as feed}
                <button 
                    class="w-full text-left px-3 py-1.5 text-sm truncate {$selectedFeedId === feed.id ? 'text-white bg-vesper-charcoal border-l-2 border-vesper-ftPink' : 'text-gray-400 hover:text-white'}"
                    on:click={() => selectFeed(feed.id)}
                >
                    {feed.title}
                </button>
            {/each}
        </div>
    </div>
</div>
