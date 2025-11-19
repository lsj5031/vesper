<script lang="ts">
    import { liveQuery } from 'dexie';
    import { db, type Feed } from '../db';
    import { selectedFeedId, selectedArticleId } from '../stores';
    import { importOPML, exportOPML } from '../opml';
    import { addNewFeed, refreshAllFeeds, syncFeed } from '../rss';
    
    // Live Queries
    const folders = liveQuery(() => db.folders.toArray());
    const feeds = liveQuery(() => db.feeds.toArray());
    
    // Derived state (naive grouping for simple template)
    $: feedsList = $feeds || [];
    $: foldersList = $folders || [];
    
    let newFeedUrl = '';
    let isImporting = false;
    let isManaging = false;
    let refreshingFeeds = new Set<number>();
    
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

    async function handleRefreshFeed(feed: Feed, e: Event) {
        e.stopPropagation();
        if (!feed.id) return;
        
        refreshingFeeds.add(feed.id);
        refreshingFeeds = refreshingFeeds; // Trigger reactivity
        
        try {
            await syncFeed(feed);
        } catch (err) {
            console.error('Feed refresh failed', err);
        } finally {
            refreshingFeeds.delete(feed.id);
            refreshingFeeds = refreshingFeeds;
        }
    }

    function getRefreshButtonClass(feedId: number | undefined): string {
        if (!feedId) return 'text-o3-black-50 hover:text-o3-teal px-1';
        return refreshingFeeds.has(feedId) 
            ? 'text-o3-black-50 hover:text-o3-teal px-1 animate-spin'
            : 'text-o3-black-50 hover:text-o3-teal px-1';
    }

    async function handleDeleteFeed(feed: Feed, e: Event) {
        e.stopPropagation();
        if (!feed.id) return;
        if (!confirm(`Are you sure you want to delete "${feed.title}"?`)) return;
        
        await db.feeds.delete(feed.id);
        // Also clean up articles? Dexie doesn't cascade delete by default usually, 
        // but for now we just delete the feed. 
        // Ideally we should delete articles too:
        await db.articles.where('feedId').equals(feed.id).delete();
        
        if ($selectedFeedId === feed.id) {
            $selectedFeedId = 'all';
        }
    }
</script>

<div class="h-full flex flex-col bg-o3-black-90 border-r border-o3-black-30">
    <!-- Header -->
    <div class="p-4 border-b border-o3-black-30">
        <h1 class="text-2xl font-headline font-bold text-o3-white tracking-tight mb-1">Vesper</h1>
        <p class="text-xs text-o3-black-50 uppercase tracking-widest">Where the day settles</p>
    </div>

    <!-- Controls -->
    <div class="p-4 space-y-2 border-b border-o3-black-30">
        <div class="flex gap-2">
            <input 
                type="text" 
                bind:value={newFeedUrl} 
                placeholder="Feed URL..." 
                class="input bg-o3-black-80 border-none text-sm h-8 rounded-none placeholder-o3-black-50 focus:ring-1 focus:ring-o3-teal w-full"
                on:keydown={(e) => e.key === 'Enter' && handleAddFeed()}
            />
            <button class="btn btn-sm variant-filled-primary rounded-none font-bold text-xs" on:click={handleAddFeed}>+</button>
        </div>
        <div class="flex justify-between text-[10px] text-o3-black-50 uppercase tracking-wider font-bold">
            <button class="hover:text-o3-white" on:click={() => document.getElementById('opmlInput')?.click()}>Import OPML</button>
            <button class="hover:text-o3-white" on:click={exportOPML}>Export</button>
            <input type="file" id="opmlInput" class="hidden" on:change={handleFileSelect} accept=".opml,.xml" />
        </div>
        <div class="flex gap-1">
            <button class="flex-1 text-[10px] bg-o3-black-80 hover:bg-o3-black-70 py-1 text-o3-paper" on:click={refreshAllFeeds}>
                Refresh All
            </button>
            <button 
                class="px-2 text-[10px] py-1 {isManaging ? 'bg-o3-teal text-o3-black-90' : 'bg-o3-black-80 text-o3-paper hover:bg-o3-black-70'}" 
                on:click={() => isManaging = !isManaging}
            >
                {isManaging ? 'Done' : 'Manage'}
            </button>
        </div>
    </div>

    <!-- Feeds List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-4">
        <!-- Special Filters -->
        <div class="space-y-0.5">
            <button 
                class="w-full text-left px-3 py-1.5 text-sm font-medium {$selectedFeedId === 'all' ? 'text-o3-teal bg-o3-black-80' : 'text-o3-black-40 hover:bg-o3-black-80/50'}"
                on:click={() => $selectedFeedId = 'all'}
            >
                All Articles
            </button>
            <button 
                class="w-full text-left px-3 py-1.5 text-sm font-medium {$selectedFeedId === 'starred' ? 'text-o3-teal bg-o3-black-80' : 'text-o3-black-40 hover:bg-o3-black-80/50'}"
                on:click={() => $selectedFeedId = 'starred'}
            >
                Starred
            </button>
        </div>

        <div class="divider-h border-o3-black-80 my-2"></div>

        <!-- Folders -->
        {#each foldersList as folder}
            <div class="space-y-0.5">
                <div class="px-3 py-1 text-xs font-bold text-o3-black-50 uppercase tracking-wider">
                    {folder.name}
                </div>
                {#each feedsList.filter(f => f.folderId === folder.id) as feed}
                    <div class="group flex items-center w-full {$selectedFeedId === feed.id ? 'bg-o3-black-80 border-l-2 border-o3-teal' : 'hover:bg-o3-black-80/30'}">
                        <button 
                            class="flex-1 text-left px-3 py-1.5 text-sm truncate {$selectedFeedId === feed.id ? 'text-o3-white' : 'text-o3-black-40 group-hover:text-o3-white'}"
                            on:click={() => selectFeed(feed.id)}
                        >
                            {feed.title}
                        </button>
                        
                        <div class="flex items-center pr-2 gap-1">
                            {#if feed.error}
                                <span class="text-o3-claret text-xs font-bold cursor-help" title={feed.error}>!</span>
                            {/if}
                            
                            {#if isManaging}
                                <button 
                                    class="text-o3-black-50 hover:text-o3-claret px-1"
                                    on:click={(e) => handleDeleteFeed(feed, e)}
                                >
                                    ×
                                </button>
                            {:else}
                                <button 
                                    class={getRefreshButtonClass(feed.id)}
                                    on:click={(e) => handleRefreshFeed(feed, e)}
                                    disabled={feed.id ? refreshingFeeds.has(feed.id) : false}
                                >
                                    ↻
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/each}

        <!-- Uncategorized -->
        <div class="space-y-0.5">
            <div class="px-3 py-1 text-xs font-bold text-o3-black-50 uppercase tracking-wider">
                Feeds
            </div>
            {#each feedsList.filter(f => !f.folderId) as feed}
                <div class="group flex items-center w-full {$selectedFeedId === feed.id ? 'bg-o3-black-80 border-l-2 border-o3-teal' : 'hover:bg-o3-black-80/30'}">
                    <button 
                        class="flex-1 text-left px-3 py-1.5 text-sm truncate {$selectedFeedId === feed.id ? 'text-o3-white' : 'text-o3-black-40 group-hover:text-o3-white'}"
                        on:click={() => selectFeed(feed.id)}
                    >
                        {feed.title}
                    </button>

                    <div class="flex items-center pr-2 gap-1">
                        {#if feed.error}
                            <span class="text-o3-claret text-xs font-bold cursor-help" title={feed.error}>!</span>
                        {/if}
                        
                        {#if isManaging}
                            <button 
                                class="text-o3-black-50 hover:text-o3-claret px-1"
                                on:click={(e) => handleDeleteFeed(feed, e)}
                            >
                                ×
                            </button>
                        {:else}
                            <button 
                                class={getRefreshButtonClass(feed.id)}
                                on:click={(e) => handleRefreshFeed(feed, e)}
                                disabled={feed.id ? refreshingFeeds.has(feed.id) : false}
                            >
                                ↻
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
