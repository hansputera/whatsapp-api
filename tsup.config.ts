import {defineConfig} from 'tsup';

export default defineConfig({
    bundle: true,
    entry: ['./src/index.ts', './src/worker.ts'],
    clean: true,
    minify: true,
    minifySyntax: true,
    outDir: './dist',
    platform: 'node',
    target: ['node14', 'node16', 'node18'],
    tsconfig: './tsconfig.json',
});
