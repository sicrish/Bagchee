/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aapka palette
        primary: {
          DEFAULT: '#008DDA', 
          hover: '#006B9E',
          dark: '#006090',
          50: '#e0f2fe',
        },
        secondary: {
          DEFAULT: '#41C9E2',
          light: '#ACE2E1',
        },
        accent: {
          DEFAULT: '#FFC107',
          hover: '#FFD700',
        },
        cream: {
          DEFAULT: '#F7EEDD',
          50: '#F7EEDD',
          100: '#fffdf5',
          200: '#e6decd',
        },
        text: {
          main: '#0B2F3A',
          muted: '#4A6fa5',
          light: '#FFFFFF',
        },
        red: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
       // 1. Outfit (Best for Main Headings)
       display: ['Outfit', 'sans-serif'],
        
       // 2. Montserrat (Best for Subheadings / Buttons)
       montserrat: ['Montserrat', 'sans-serif'],
       
       // 3. Roboto (Best for Long Text / Body)
       body: ['Roboto', 'sans-serif'],
       
       // 4. Dancing Script (Best for Signatures or "Special Offers")
       script: ['"Dancing Script"', 'cursive'],
      },
      letterSpacing: {
        // Smart/Puma look ke liye spacing
        tightest: '-.075em',
        slick: '0.2em',
      },
      keyframes: {
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      animation: {
        'fadeInLeft': 'fadeInLeft 0.8s ease-out forwards',
        'fadeInRight': 'fadeInRight 0.8s ease-out forwards',
      }
    },
  },
  plugins: [],
}