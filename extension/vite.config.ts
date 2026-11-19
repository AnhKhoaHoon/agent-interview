import { fileURLToPath, URL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'benchmark' ? [{
    name: 'local-benchmark-permission',
    async closeBundle() {
      const manifest = JSON.parse(await readFile(new URL('./public/manifest.json', import.meta.url), 'utf8')) as { host_permissions: string[] };
      manifest.host_permissions.push('http://localhost:4318/*');
      await writeFile(new URL('./dist/manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
    }
  }] : [])],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: fileURLToPath(new URL('./sidepanel.html', import.meta.url)),
        'service-worker': fileURLToPath(new URL('./src/background/service-worker.ts', import.meta.url))
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
}));
