/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
    content: ["./**/*.liquid", "./src/**/*.{js,ts,jsx,tsx}", "./templates/**/*.{liquid,json}"],
    safelist: ["grid-cols-3", "grid-cols-2"],
    theme: {
        extend: {
            screens: {
                xlg: "1800px"
            },
            colors: {
                text: "var(--color-text)",
                textLink: "var(--color-text-link)",
                textError: "var(--color-text-error)",
                textSuccess: "var(--color-text-success)",
                background: "var(--color-background)",
                border: "var(--color-border)",
                textButton: "var(--color-text-button)",
                backgroundButton: "var(--color-background-button)",
                backgroundButtonHover: "var(--color-background-button-hover)"
            },
            fontFamily: {
                logo: "var(--font-logo)",
                heading: "var(--font-heading)",
                body: "var(--font-body)"
            },
            boxShadow: {
                'product': '0 20px 40px -20px rgba(0, 0, 0, 0.15)',
                'product-hover': '0 25px 50px -25px rgba(0, 0, 0, 0.2)'
            },
            typography: {
                DEFAULT: {
                    css: {
                        color: '#000000',
                        a: {
                            color: '#000000',
                            textDecoration: 'underline',
                            '&:hover': {
                                color: '#404040',
                            },
                        },
                        strong: { color: '#000000' },
                        h1: { color: '#000000' },
                        h2: { color: '#000000' },
                        h3: { color: '#000000' },
                        h4: { color: '#000000' },
                        blockquote: {
                            color: '#404040',
                            borderLeftColor: '#e5e5e5',
                        },
                        code: { color: '#000000' },
                        'code::before': { content: '""' },
                        'code::after': { content: '""' },
                    },
                },
            },
        }
    },
    plugins: [
        require('@tailwindcss/typography')
    ],
    blocklist: ["container"]
};
