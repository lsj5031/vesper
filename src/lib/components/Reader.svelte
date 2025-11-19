<script lang="ts">
    import { liveQuery } from 'dexie';
    import { db } from '../db';
    import { selectedArticleId } from '../stores';
    import { format } from 'date-fns';

    // READ-ONLY query - just fetch the article
    $: articleStore = liveQuery(async () => {
        if (!$selectedArticleId) return null;
        return await db.articles.get($selectedArticleId);
    });
    
    // SEPARATE side effect for marking as read
    // This runs outside liveQuery context, so it's safe to write
    $: {
        if ($selectedArticleId && $articleStore && $articleStore.read === 0) {
            db.articles.update($selectedArticleId, { read: 1 })
                .catch(err => console.error('Failed to mark as read:', err));
        }
    }
    
    async function toggleStar(article: any) {
        await db.articles.update(article.id!, { starred: article.starred ? 0 : 1 });
    }
</script>

<div class="h-full overflow-y-auto bg-o3-black-90 min-h-0">
    {#if $articleStore}
        <article class="max-w-3xl mx-auto px-8 py-12">
            <!-- Header -->
            <header class="mb-10 border-b border-o3-black-30 pb-8">
                <div class="flex justify-between items-start mb-6">
                     <span class="bg-o3-paper text-o3-teal px-2 py-1 text-xs font-bold uppercase tracking-widest">
                        News
                    </span>
                    <button on:click={() => toggleStar($articleStore)}>
                        {#if $articleStore.starred}
                            <span class="text-o3-claret text-2xl">★</span>
                        {:else}
                            <span class="text-o3-black-50 text-2xl hover:text-o3-white">☆</span>
                        {/if}
                    </button>
                </div>

                <h1 class="text-4xl md:text-5xl font-headline font-bold text-o3-white leading-tight mb-6">
                    {$articleStore.title}
                </h1>

                <div class="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-o3-black-50">
                    <span>By <span class="text-o3-white border-b border-o3-teal">{$articleStore.author || 'Unknown'}</span></span>
                    <time>{format(new Date($articleStore.isoDate), 'MMMM d, yyyy')}</time>
                </div>
                
                <div class="mt-4">
                     <a href={$articleStore.link} target="_blank" class="text-xs text-o3-teal hover:text-o3-white transition-colors">
                        Read Original ↗
                    </a>
                </div>
            </header>

            <!-- Content -->
            <div class="prose-vesper">
                {@html $articleStore.content}
            </div>
            
            <footer class="mt-20 pt-10 border-t border-o3-black-30 text-center">
                 <p class="text-o3-black-50 italic font-headline">End of Article</p>
            </footer>
        </article>
    {:else}
        <div class="h-full flex items-center justify-center text-o3-black-60 flex-col">
            <div class="text-6xl mb-4 opacity-20">V</div>
            <p class="font-headline italic text-xl opacity-50">Select an article to begin.</p>
        </div>
    {/if}
</div>
