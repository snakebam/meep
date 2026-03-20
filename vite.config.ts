import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localFilesPlugin } from './vite-plugin-local-files'

// Local files directory — outside the project so app updates don't touch it
const LOCAL_FILES_DIR = process.env.LOCAL_FILES_DIR || 'C:/VWO-Bestanden'

export default defineConfig({
  plugins: [react(), tailwindcss(), localFilesPlugin(LOCAL_FILES_DIR)],
})
