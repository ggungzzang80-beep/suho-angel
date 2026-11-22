/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FCFAF6',
          100: '#F8F3EA',
          200: '#F0E8D9',
          300: '#E3D7C2',
          400: '#D2C2A6',
        },
        night: {
          900: '#0B0F21',
          800: '#121833',
          700: '#1B2344',
          600: '#28325C',
          500: '#3A4574',
        },
        gold: {
          600: '#A9853F',
          500: '#C8A15E',
          400: '#DBBD86',
          300: '#ECD9B2',
          100: '#F7EFDD',
        },
        blush: { 500: '#D98F86', 300: '#EDBFB8', 100: '#FAE6E2' },
        lilac: { 500: '#8E7DC0', 300: '#C3B6E4', 100: '#EDE7F8' },
        mint: { 500: '#5FA491', 300: '#A9D6C7', 100: '#E4F3ED' },
        sky: { 500: '#5C82BC', 300: '#A6C0E4', 100: '#E6EEF9' },
        clay: { 500: '#A97B5F', 300: '#D9BDAA', 100: '#F4E8DF' },
        ink: {
          900: '#1A1A1C',
          800: '#2A2A2E',
          700: '#3E3E45',
          600: '#565660',
          500: '#74747F',
          400: '#9A9AA4',
        },
      },
      fontFamily: {
        display: ['"Gowun Batang"', '"Noto Serif KR"', 'Georgia', 'serif'],
        sans: ['Pretendard', '"Noto Sans KR"', '-apple-system', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,26,28,0.04), 0 14px 34px -20px rgba(26,26,28,0.28)',
        lift: '0 2px 8px rgba(26,26,28,0.06), 0 28px 64px -30px rgba(26,26,28,0.34)',
        glow: '0 0 0 1px rgba(200,161,94,0.28), 0 18px 46px -22px rgba(200,161,94,0.55)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        twinkle: { '0%,100%': { opacity: '0.2' }, '50%': { opacity: '0.85' } },
        drift: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        orbit: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        sheetUp: { '0%': { transform: 'translateY(28px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        rise: 'rise 0.6s cubic-bezier(0.16,1,0.3,1) both',
        fade: 'fade 0.5s ease both',
        twinkle: 'twinkle 6s ease-in-out infinite',
        drift: 'drift 7s ease-in-out infinite',
        orbit: 'orbit 90s linear infinite',
        sheetUp: 'sheetUp 0.32s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};
