/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Đảm bảo dòng này có
  ],
  theme: {
    extend: {
      fontFamily: {
        // Thêm font Inter như trong thiết kế (tùy chọn)
        inter: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
