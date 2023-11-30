
const path = require('path');
const fs = require('fs');

// Relative path of the directory where the SDK and Plugin are located
const sdkAndPluginDirPath = '../../../../'
const sdkDirs = fs.readdirSync(sdkAndPluginDirPath);

// Get one directory where the SDK is located
function getSdkDirectory() {
  const sdkRepo = new RegExp('CubismWebSamples*|CubismSdkForWeb*');
  return sdkAndPluginDirPath + sdkDirs.filter(dir => sdkRepo.test(dir))[0];
}

module.exports = {
  mode: 'production',
  target: ['web', 'es5'],
  entry: './src/mainmotionsync.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@framework': path.resolve(__dirname,  getSdkDirectory() + '/Framework/src'),
      '@cubismsdksamples': path.resolve(__dirname, getSdkDirectory() + '/Samples/TypeScript/Demo/src'),
      '@motionsyncframework': path.resolve(__dirname, '../../../Framework/src')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      }
    ]
  },
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, sdkAndPluginDirPath),
        serveIndex: true,
        watch: true,
      }
    ],
    hot: true,
    port: 5000,
    host: '0.0.0.0',
    compress: true,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  devtool: 'inline-source-map'
}
