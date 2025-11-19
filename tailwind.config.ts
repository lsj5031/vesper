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
                vesper: {
                    salmon:     '#fff1e5',    /* FT pink paper */
                    salmonDark: '#fce4d6',
                    pink:       '#e00b50',    /* FT magenta accent (old) */
                    ftPink:     '#990f3d',    /* 2025 FT primary accent */
                    dark:       '#0f1419',    /* Almost black */
                    charcoal:   '#1f2a33',
                    midgray:    '#333d47',
                    lightgray:  '#98a7b9',
                    white:      '#ffffff',
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
