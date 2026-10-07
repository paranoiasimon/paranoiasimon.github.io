import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Listen on all network interfaces so Android phones on the same Wi-Fi
// can open the React app using the PC's LAN IP address.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})
