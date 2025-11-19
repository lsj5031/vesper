<script lang="ts">
    import { showHelp } from '../stores';

    function close() {
        $showHelp = false;
    }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-o3-black-90/90 backdrop-blur-sm">
    <button
        class="fixed inset-0"
        on:click={close}
        aria-label="Close help modal"
    ></button>
    
    <div 
        class="bg-o3-black-80 border border-o3-teal p-6 shadow-2xl max-w-md w-full rounded relative z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
    >
        <div class="mb-6">
            <h2 id="help-title" class="text-2xl font-headline font-bold text-o3-white mb-2">Keyboard Shortcuts</h2>
            <p class="text-sm text-o3-black-40">Press Escape to close</p>
        </div>

        <div class="space-y-3">
            <div class="flex justify-between items-start">
                <span class="text-sm text-o3-black-40">Next Article</span>
                <kbd class="bg-o3-black-90 border border-o3-black-30 rounded px-2 py-1 text-xs font-mono text-o3-teal">j</kbd>
            </div>
            
            <div class="flex justify-between items-start">
                <span class="text-sm text-o3-black-40">Previous Article</span>
                <kbd class="bg-o3-black-90 border border-o3-black-30 rounded px-2 py-1 text-xs font-mono text-o3-teal">k</kbd>
            </div>
            
            <div class="flex justify-between items-start">
                <span class="text-sm text-o3-black-40">Refresh All Feeds</span>
                <kbd class="bg-o3-black-90 border border-o3-black-30 rounded px-2 py-1 text-xs font-mono text-o3-teal">r</kbd>
            </div>
            
            <div class="flex justify-between items-start">
                <span class="text-sm text-o3-black-40">Toggle Help</span>
                <kbd class="bg-o3-black-90 border border-o3-black-30 rounded px-2 py-1 text-xs font-mono text-o3-teal">?</kbd>
            </div>
            
            <div class="flex justify-between items-start">
                <span class="text-sm text-o3-black-40">Close Modal</span>
                <kbd class="bg-o3-black-90 border border-o3-black-30 rounded px-2 py-1 text-xs font-mono text-o3-teal">Esc</kbd>
            </div>
        </div>

        <div class="mt-6 text-center">
            <button 
                class="text-sm text-o3-black-40 hover:text-o3-teal transition"
                on:click={close}
            >
                Close
            </button>
        </div>
    </div>
</div>

<style>
    :global(body) {
        overflow: hidden;
    }
</style>
