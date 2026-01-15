import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Istruisce Vite a non includere questi pacchetti nel bundle
      // Saranno risolti a runtime dal browser tramite importmap in index.html
      external: [
        'firebase/app',
        'firebase/firestore',
        'firebase/storage',
        '@google/genai'
      ],
      output: {
        globals: {
          'firebase/app': 'firebase',
          'firebase/firestore': 'firebaseFirestore',
          'firebase/storage': 'firebaseStorage',
          '@google/genai': 'GoogleGenAI'
        }
      }
    }
  }
});