
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				'source-sans': ['Source Sans 3', 'system-ui', 'sans-serif'],
				'serif-content': ['Source Serif 4', 'Georgia', 'serif'],
				'cinzel': ['Cinzel', 'serif'],
				'condensed': ['Oswald', 'sans-serif'],
				'legal': ['Crimson Text', 'Georgia', 'serif'],
				'playfair': ['Playfair Display', 'serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				rest: {
					blue: '#0077B6',
					lightblue: '#90E0EF',
					darkblue: '#03045E',
					cyan: '#00B4D8',
					light: '#000000',
					dark: '#FFFFFF'
				},
				'navy-card': 'hsl(var(--navy-card))',
				'navy-gradient-start': 'hsl(var(--navy-gradient-start))',
				'navy-gradient-end': 'hsl(var(--navy-gradient-end))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				'fade-in-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-from-bottom': {
					'0%': {
						opacity: '0',
						transform: 'translateY(100%)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'shake': {
					'0%, 100%': {
						transform: 'translateX(0)'
					},
					'25%': {
						transform: 'translateX(-4px)'
					},
					'75%': {
						transform: 'translateX(4px)'
					}
				},
				'bounceRight': {
					'0%, 100%': {
						transform: 'translateX(0)'
					},
					'50%': {
						transform: 'translateX(4px)'
					}
				},
				'pulse-success': {
					'0%, 100%': {
						transform: 'scale(1)',
						opacity: '1'
					},
					'50%': {
						transform: 'scale(1.02)',
						opacity: '0.95'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'wave-pulse': {
					'0%, 100%': {
						transform: 'scaleY(0.3)'
					},
					'50%': {
						transform: 'scaleY(1)'
					}
				},
				'glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(var(--primary), 0.3)'
					},
					'50%': {
						boxShadow: '0 0 40px rgba(var(--primary), 0.6)'
					}
				},
				'bounce-in': {
					'0%': {
						transform: 'scale(0)',
						opacity: '0'
					},
					'50%': {
						transform: 'scale(1.1)'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				},
				'slide-up-fade': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)',
						filter: 'blur(4px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)',
						filter: 'blur(0)'
					}
				},
				'slide-in-right': {
					'0%': {
						transform: 'translateX(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'slide-out-right': {
					'0%': {
						transform: 'translateX(0)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(100%)',
						opacity: '0'
					}
				},
				'press': {
					'0%': {
						transform: 'scale(1)'
					},
					'50%': {
						transform: 'scale(0.95)'
					},
					'100%': {
						transform: 'scale(1)'
					}
				},
				'pop': {
					'0%': {
						transform: 'scale(0.9)',
						opacity: '0'
					},
					'50%': {
						transform: 'scale(1.02)'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-down': {
					'0%': {
						opacity: '0',
						transform: 'translateY(-10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.15s ease-out',
				'fade-in-fast': 'fade-in 0.1s ease-out',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'spin-slow': 'spin 8s linear infinite',
				'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'shake': 'shake 0.4s ease-in-out',
				'pulse-success': 'pulse-success 0.6s ease-in-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'scale-in-fast': 'scale-in 0.15s ease-out',
				'wave-pulse': 'wave-pulse 1s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'shimmer': 'shimmer 2s linear infinite',
				'slide-up-fade': 'slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'press': 'press 0.15s ease-out',
				'pop': 'pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'slide-down': 'slide-down 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
