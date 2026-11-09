/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: {
            DEFAULT: 'var(--whatsapp-primary, #00a884)',
            light: '#25d366',
            dark: '#008069',
            outgoingLight: '#d9fdd3',
            outgoingDark: '#005c4b',
          },
          dark: {
            bg: '#0c1317',
            panel: '#111b21',
            subtle: '#202c33',
            hover: '#202c33',
            active: '#2a3942',
            border: '#222e35',
            incoming: '#202c33',
            outgoing: '#005c4b',
            text: '#e9edef',
            textSecondary: '#8696a0',
          },
          light: {
            bg: '#efeae2',
            panel: '#ffffff',
            hover: '#f5f6f6',
            active: '#ebebeb',
            border: '#e9edef',
            incoming: '#ffffff',
            outgoing: '#d9fdd3',
            text: '#111b21',
            textSecondary: '#667781',
          },
          blue: {
            check: '#53bdeb',
          }
        }
      }
    },
  },
  plugins: [],
}
