// Shared Tailwind Play-CDN config, loaded on every page right after the CDN script.
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#121212',
        paper: '#faf9f7',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
};
