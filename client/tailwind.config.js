/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: '#1B5E20',       // Primary (headers, navbars)
        mediumGreen: '#2E7D32',  // Secondary (buttons, active states)
        freshGreen: '#43A047',   // Tertiary (progress bars, highlights)
        mintGreen: '#A5D6A7',    // Soft Accent (info banners, hover)
        canvasBg: '#FBFAF6',     // Background (Off-White)
        surface: '#FFFFFF',      // Card/Surface Background
        goldAccent: '#D4AF37',   // Gold Accent (winner badges only)
        textDark: '#2C2C2C',     // Text Primary
        textMuted: '#6B6B60',    // Text Muted
        borderLight: '#E4E1D5',  // Border/Divider
        errorRed: '#D32F2F',     // Error State
        warningAmber: '#F57C00', // Warning State
      },
    },
  },
  plugins: [],
};

