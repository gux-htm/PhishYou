/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F1219',
        surface: '#15191F',
        elevated: '#1D232D',
        subtle: '#232D39',
        line: '#2D3748',
        'line-light': '#3D4860',
        ink: '#F5F7FB',
        'ink-secondary': '#A8B4C4',
        'ink-tertiary': '#7A8595',
        teal: '#2FD9C7',
        success: '#06D369',
        warning: '#F59E0B',
        danger: '#FF4757',
        info: '#5B9EFF',
        insight: '#A78BFA',
      },
      boxShadow: {
        panel: '0 20px 70px rgba(0, 0, 0, .28), inset 0 1px 0 rgba(255,255,255,.03)',
        'glow-teal': '0 0 32px rgba(47, 217, 199, .18)',
        'glow-danger': '0 0 32px rgba(255, 71, 87, .16)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        signalSweep: {
          '0%': { transform: 'translateX(-115%)', opacity: '0' },
          '12%': { opacity: '.75' },
          '55%': { opacity: '.2' },
          '100%': { transform: 'translateX(115%)', opacity: '0' },
        },
        orbitDrift: {
          '0%, 100%': { transform: 'rotate(0deg) translateY(0)' },
          '50%': { transform: 'rotate(180deg) translateY(-5px)' },
        },
      },
      animation: {
        'signal-sweep': 'signalSweep 7s cubic-bezier(.16,1,.3,1) infinite',
        'orbit-drift': 'orbitDrift 14s linear infinite',
      },
    },
  },
  plugins: [],
}
