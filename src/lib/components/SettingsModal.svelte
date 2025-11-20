<script lang="ts">
    import { showSettings, themeMode } from '../stores';
    import { importOPML, exportOPML } from '../opml';
    import { importBackup, exportBackup } from '../backup';

    function close() {
        $showSettings = false;
    }

    let isDark: boolean;
    $: isDark = $themeMode === 'dark';

    function handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.length) {
            importOPML(input.files[0]).then(() => alert('Imported!'));
        }
    }

    function handleBackupSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.length) {
            importBackup(input.files[0]).then(() => alert('Restored!'));
        }
    }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center" style={`background:${isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'}`}>
    <button 
        class="fixed inset-0 cursor-default"
        on:click={close}
        aria-label="Close settings modal"
    ></button>
    
    <div 
        class="border border-o3-teal p-6 shadow-2xl max-w-md w-full rounded relative z-10"
        role="dialog"
        aria-modal="true"
        style={`background:var(--vesper-panel)`}
    >
        <div class="mb-6">
            <h2 class="text-2xl font-headline font-bold mb-2" style={`color:${isDark ? 'var(--o3-color-palette-white)' : 'var(--o3-color-palette-black-90)'}`}>Settings & Data</h2>
            <p class="text-sm" style={`color:${isDark ? 'var(--o3-color-palette-black-40)' : 'var(--o3-color-palette-black-70)'}`}>Manage your feeds and data</p>
        </div>

        <div class="space-y-6">
            <!-- OPML -->
            <div class="space-y-2">
                <h3 class="text-sm font-bold text-o3-teal uppercase tracking-wider" style={`color:${isDark ? 'var(--o3-color-palette-teal)' : 'var(--o3-color-palette-teal)'}`}>OPML Import/Export</h3>
                <div class="flex gap-2">
                    <button 
                        class="flex-1 o3-button o3-button--secondary o3-button--small o3-button-icon o3-button-icon--upload" 
                        data-o3-theme="inverse"
                        on:click={() => document.getElementById('opmlInput')?.click()}
                    >
                        Import OPML
                    </button>
                    <button 
                        class="flex-1 o3-button o3-button--secondary o3-button--small o3-button-icon o3-button-icon--download" 
                        data-o3-theme="inverse"
                        on:click={exportOPML}
                    >
                        Export OPML
                    </button>
                </div>
                <input type="file" id="opmlInput" class="hidden" on:change={handleFileSelect} accept=".opml,.xml" />
            </div>

            <!-- Backup -->
            <div class="space-y-2">
                <h3 class="text-sm font-bold text-o3-teal uppercase tracking-wider" style={`color:${isDark ? 'var(--o3-color-palette-teal)' : 'var(--o3-color-palette-teal)'}`}>Full Backup</h3>
                <div class="flex gap-2">
                    <button 
                        class="flex-1 o3-button o3-button--secondary o3-button--small o3-button-icon o3-button-icon--restore" 
                        data-o3-theme="inverse"
                        on:click={() => document.getElementById('backupInput')?.click()}
                    >
                        Restore Backup
                    </button>
                    <button 
                        class="flex-1 o3-button o3-button--secondary o3-button--small o3-button-icon o3-button-icon--download" 
                        data-o3-theme="inverse"
                        on:click={exportBackup}
                    >
                        Backup Data
                    </button>
                </div>
                <input type="file" id="backupInput" class="hidden" on:change={handleBackupSelect} accept=".json" />
            </div>
        </div>

        <div class="mt-8 text-center">
            <button 
                class="o3-button o3-button--ghost o3-button--small"
                data-o3-theme="inverse"
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
