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
				// Paleta GibiPromo
				primary: {
					purple: '#6C2BD9',
					yellow: '#F5C542',
					dark: '#1E1E2A',
					light: '#C8B8FF',
					white: '#F5F5F5'
				},
				// Tons de roxo
				purple: {
					50: '#F7F3FF',
					100: '#EDE5FF',
					200: '#DDD0FF',
					300: '#C8B8FF',
					400: '#B399FF',
					500: '#9F7AFF',
					600: '#6C2BD9',
					700: '#5A23B8',
					800: '#4A1D96',
					900: '#3D1975',
					950: '#2A1050'
				},
				// Tons de amarelo
				yellow: {
					50: '#FEFDF0',
					100: '#FEFBE8',
					200: '#FCF5C2',
					300: '#F9EA8F',
					400: '#F5C542',
					500: '#F0B90B',
					600: '#D19A06',
					700: '#B17C09',
					800: '#8F600F',
					900: '#764E11'
				},
				// Tons de cinza escuro
				dark: {
					50: '#F8F8FA',
					100: '#F1F1F3',
					200: '#DFDFE5',
					300: '#C8C8D1',
					400: '#ADADBA',
					500: '#9191A3',
					600: '#75758A',
					700: '#5E5E70',
					800: '#4F4F5C',
					900: '#44444F',
					950: '#1E1E2A'
				}
			},
			fontFamily: {
				'sans': ['Inter', 'Nunito', 'system-ui', 'sans-serif'],
				'display': ['Rubik', 'Poppins', 'system-ui', 'sans-serif'],
			},
			backgroundImage: {
				'hero-pattern': "url('/src/assets/hero-bg.svg')",
				'comic-texture': "url('/src/assets/comic-texture.svg')",
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'bounce-gentle': 'bounceGentle 2s infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				bounceGentle: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				}
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
			},
			borderRadius: {
				'xl': '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem',
			},
			boxShadow: {
				'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
				'card': '0 4px 6px -1px rgba(108, 43, 217, 0.1), 0 2px 4px -1px rgba(108, 43, 217, 0.06)',
				'card-hover': '0 10px 25px -3px rgba(108, 43, 217, 0.15), 0 4px 6px -2px rgba(108, 43, 217, 0.05)',
			}
		},
	},
	plugins: [],
}