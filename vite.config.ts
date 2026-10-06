import { randomUUID } from 'node:crypto';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  define: {
    __DEV_SERVER_RUN_ID__: JSON.stringify(
      command === 'serve' ? randomUUID() : ''
    ),
  },
}));