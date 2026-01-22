import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  root: "src/renderer",
  base: "./",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/renderer/index.html"),
        tasks: path.resolve(__dirname, "src/renderer/tasks.html"),
        island: path.resolve(__dirname, "src/renderer/island.html")
      },
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-markdown": ["react-markdown", "remark-gfm", "prism-react-renderer"],
          "vendor-icons": ["lucide-react"]
        }
      }
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src/renderer")
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
