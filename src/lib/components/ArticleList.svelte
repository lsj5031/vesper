<script lang="ts">
    import { liveQuery } from 'dexie';
    import { db, type Article } from '../db';
    import { selectedFeedId, selectedArticleId } from '../stores';
    import { formatDistanceToNow } from 'date-fns';
    
    // We need a reactive query that depends on $selectedFeedId
    // Svelte's $: reactivity works well with Dexie's liveQuery if we reconstruct the query
    
    let articlesStore: any;
    
    $: {
        const fid = $selectedFeedId;
        articlesStore = liveQuery(async () => {
            if (fid === 'all') {
                return await db.articles.orderBy('isoDate').reverse().limit(200).toArray();
            } else if (fid === 'starred') {
                return await db.articles.where('starred').equals(1).reverse().sortBy('isoDate');
            } else if (typeof fid === 'number') {
                return await db.articles.where('feedId').equals(fid).reverse().sortBy('isoDate');
            }
            return [];
        });
    }
    
    // Helper for date
    const formatDate = (iso: string) => {
        try {
            return formatDistanceToNow(new Date(iso), { addSuffix: true });
        } catch {
            return 'recently';
        }
    }

    function selectArticle(id: number | undefined) {
        if (id !== undefined) {
            $selectedArticleId = id;
        }
    }
</script>

<div class="h-full flex flex-col bg-o3-black-90">
    <!-- Toolbar -->
    <div class="h-14 border-b border-o3-black-30 flex items-center px-4 justify-between sticky top-0 bg-o3-black-90 z-10">
        <span class="text-xs font-bold uppercase tracking-wider text-o3-black-50">
            {#if $selectedFeedId === 'all'}All Articles
            {:else if $selectedFeedId === 'starred'}Starred
            {:else}Feed Articles{/if}
        </span>
    </div>

    <!-- List - flex-1 with min-h-0 enables overflow scrolling -->
    <div class="flex-1 overflow-y-auto min-h-0">
        {#if $articlesStore}
            {#each $articlesStore as article (article.id)}
                <button 
                    class="w-full text-left p-4 border-b border-o3-black-30 hover:bg-o3-black-80 group transition-colors relative
                    {$selectedArticleId === article.id ? 'bg-o3-black-80' : ''}"
                    on:click={() => selectArticle(article.id)}
                >
                    {#if article.read === 0}
                        <span class="absolute top-4 right-4 badge-unread">New</span>
                    {/if}
                    
                    <div class="text-xs text-o3-teal mb-1 font-bold uppercase tracking-wide">
                        {article.author || 'Unknown'}
                    </div>
                    
                    <h3 class="font-headline font-bold text-lg leading-snug mb-2 text-o3-black-5 group-hover:text-o3-white">
                        {article.title}
                    </h3>
                    
                    <div class="text-sm text-o3-black-40 line-clamp-2 mb-2 font-body leading-relaxed">
                        {article.snippet}
                    </div>
                    
                    <div class="text-[10px] text-o3-black-50 uppercase tracking-wider font-bold">
                        {formatDate(article.isoDate)}
                    </div>
                </button>
            {/each}
        {:else}
            <div class="p-8 text-center text-o3-black-40">Loading...</div>
        {/if}
    </div>
</div>
