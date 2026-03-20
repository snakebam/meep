import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localFilesPlugin } from './vite-plugin-local-files'

// Local files directory — stored in 'uploads' folder, preserved across git pulls
const LOCAL_FILES_DIR = process.env.LOCAL_FILES_DIR || './uploads'

export default defineConfig({
  plugins: [react(), tailwindcss(), localFilesPlugin(LOCAL_FILES_DIR)],
})
