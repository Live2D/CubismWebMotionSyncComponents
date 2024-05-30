import { defineConfig, UserConfig, ConfigEnv, ESBuildOptions, AliasOptions } from 'vite';
import path from 'path';
import config from './vite.config.mjs';

export default defineConfig((env: ConfigEnv): UserConfig => {
  let common = config(env);
  const esbuild = common.esbuild as ESBuildOptions;
  const resolve = common.resolve as { alias?: AliasOptions; };
  resolve.alias = {
    '@framework': path.resolve(__dirname, '../../../../CubismSdkForWeb/Framework/src'),
    '@cubismsdksamples': path.resolve(__dirname, '../../../../CubismSdkForWeb/Samples/TypeScript/Demo/src'),
    '@motionsyncframework': path.resolve(__dirname, '../../../Framework/src'),
    './lappmotionsyncview': './lappmotionsyncview_microphone',
    './lappmotionsyncmodel': './lappmotionsyncmodel_microphone',
  };
  esbuild.include = [
    '../../../Framework/src/**',
    '../../../../CubismSdkForWeb/**',
    './src/lappinputdevice.ts',
    './src/lappmotionsyncdefine.ts',
    './src/lappmotionsyncdelegate.ts',
    './src/lappmotionsynclive2dmanager.ts',
    './src/lappmotionsyncmodel_microphone.ts',
    './src/lappmotionsyncview_microphone.ts',
    './src/lappplaysound.ts',
    './src/mainmotionsync.ts',
  ];
  return common;
});
