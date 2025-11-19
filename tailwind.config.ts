import { join } from 'path';
import { skeleton } from '@skeletonlabs/tw-plugin';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve(
			'@skeletonlabs/skeleton'),
			'../**/*.{html,js,svelte,ts}'
		)
	],
	theme: {
		extend: {
            colors: {
                o3: {
                    'teal': 'var(--o3-color-palette-teal)',
                    'claret': 'var(--o3-color-palette-claret)',
                    'oxford': 'var(--o3-color-palette-oxford)',
                    'paper': 'var(--o3-color-palette-paper)',
                    'white': 'var(--o3-color-palette-white)',
                    'black': 'var(--o3-color-palette-black)',
                    'slate': 'var(--o3-color-palette-slate)',
                    'black-90': 'var(--o3-color-palette-black-90)',
                    'black-80': 'var(--o3-color-palette-black-80)',
                    'black-70': 'var(--o3-color-palette-black-70)',
                    'black-60': 'var(--o3-color-palette-black-60)',
                    'black-50': 'var(--o3-color-palette-black-50)',
                    'black-40': 'var(--o3-color-palette-black-40)',
                    'black-30': 'var(--o3-color-palette-black-30)',
                    'black-20': 'var(--o3-color-palette-black-20)',
                    'black-10': 'var(--o3-color-palette-black-10)',
                    'black-5': 'var(--o3-color-palette-black-5)',
                }
            },
            fontFamily: {
                headline: ['"Playfair Display"', 'serif'],
                body: ['"IBM Plex Sans"', 'sans-serif'],
            }
        },
	},
	plugins: [
		forms,
        typography,
		skeleton({
			themes: {
                custom: [
                    {
                        name: 'vesper',
                        properties: {
                            // Exact FT-inspired Skeleton theme
                            '--theme-font-family-heading': '"Playfair Display", serif',
                            '--theme-font-family-base': '"IBM Plex Sans", sans-serif',
                            '--theme-font-color-base': '#ffffff',
                            '--theme-font-color-dark': '#0f1419',
                            '--theme-rounded-base': '0px', // Sharp edges like a newspaper
                            '--theme-rounded-container': '0px',
                            
                            // Colors
                            '--on-surface': '255 255 255',
                        }
                    }
                ]
            }
		})
	]
};
