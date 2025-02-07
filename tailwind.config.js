/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx}", // Include `app` directory (if using App Router)
		"./pages/**/*.{js,ts,jsx,tsx}", // Include `pages` directory
		"./components/**/*.{js,ts,jsx,tsx}", // Include components
	],
	theme: {
		extend: {},
	},
	plugins: [],
};
