/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,vue}",
    ],
    theme: {
        extend: {
            colors: {
                // Force Premium Gray Scale (Zinc)
                gray: colors.zinc,

                // Semantic Colors from CSS Variables
                'app': 'var(--color-bg-app)',
                'panel': 'var(--color-bg-panel)',
                'header': 'var(--color-bg-panel-header)',
                'primary': {
                    DEFAULT: 'var(--color-primary)',
                    dim: 'var(--color-primary-dim)',
                },
                'accent': 'var(--color-accent)',
                'live': 'var(--color-live)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
