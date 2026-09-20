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
				// Geist (Vercel / Basement Studio, SIL OFL) carries everything.
				// `display` deliberately points at the same family as `sans`:
				// hierarchy comes from weight, size and tracking, not from a
				// second typeface. Falls back to the system stack if Google
				// Fonts is unreachable.
				sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
				display: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
			},
			fontSize: {
				// Display scale with tracking + leading baked in. Large type needs
				// negative tracking or it reads as a default browser render - the
				// single biggest "designed vs generated" tell in big headlines.
				// Leading stays clear of descenders (several headlines use
				// bg-clip-text, which crops them if the line box is too tight).
				'display-sm': ['clamp(1.75rem, 3vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
				'display-md': ['clamp(2.25rem, 5vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
				'display-lg': ['clamp(3rem, 8vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.04em' }],
				'display-xl': ['clamp(3.5rem, 12vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
			},
			letterSpacing: {
				label: '0.28em',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
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
				clash: {
					gold: 'hsl(var(--clash-gold))',
					purple: 'hsl(var(--clash-purple))',
					blue: 'hsl(var(--clash-blue))',
					silver: 'hsl(var(--clash-silver))'
				}
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
				marquee: {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-50%)' }
				},
				caret: {
					'0%, 49%': { opacity: '1' },
					'50%, 100%': { opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				marquee: 'marquee 28s linear infinite',
				caret: 'caret 1.1s step-end infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
