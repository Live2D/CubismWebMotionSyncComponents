import { defineConfig, UserConfig, ConfigEnv } from 'vite';
import path from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig((env: ConfigEnv): UserConfig => {
  let common: UserConfig = {
    plugins: [
      basicSsl(),
    ],
    server: {
      port: 5000,
    },
    root: './',
    base: '/',
    publicDir: './public',
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@framework': path.resolve(__dirname, '../../../../CubismSdkForWeb/Framework/src'),
        '@cubismsdksamples': path.resolve(__dirname, '../../../../CubismSdkForWeb/Samples/TypeScript/Demo/src'),
        '@motionsyncframework': path.resolve(__dirname, '../../../Framework/src'),
      }
    },
    esbuild: {
      include: [
        '../../../Framework/src/**',
        '../../../../CubismSdkForWeb/**',
        './src/lappinputdevice.ts',
        './src/lappmotionsyncaudiomanager.ts',
        './src/lappmotionsyncdefine.ts',
        './src/lappmotionsyncdelegateparent.ts',
        './src/lappmotionsyncdelegate.ts',
        './src/lappmotionsynclive2dmanager.ts',
        './src/lappmotionsyncmodel.ts',
        './src/lappmotionsyncview.ts',
        './src/lappmotionsyncsubdelegate.ts',
        './src/lappmotionsyncsprite.ts',
        './src/lappaudiomanager.ts',
        './src/mainmotionsync.ts',
      ],
    },
    build: {
      target: 'modules',
      assetsDir: 'assets',
      outDir: './dist',
      sourcemap: env.mode == 'development' ? true : false,
    },
  };
  return common;
});
