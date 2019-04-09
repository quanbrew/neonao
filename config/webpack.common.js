'use strict';
// https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const rootPath = path.resolve(__dirname, '../');

module.exports = {
  entry: './src/index.tsx',
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      inject: true,
      favicon: 'public/logo.svg.png',
      minify: 'production',
    }),
  ],
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(rootPath, 'dist'),
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: 'ts-loader' },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },

      { test: /\.css$/, use: ['style-loader', 'css-loader'] },

      { test: /\.(png|svg|jpg|gif)$/, use: ['file-loader'] },
    ],
  },

  optimization: {
    // https://webpack.js.org/plugins/split-chunks-plugin/
    // splitChunks: {
    //   chunks: 'all',
    //   minSize: 30000,
    //   maxSize: 100000,
    // },
    // runtimeChunk: 'single',
  },
  externals: {
    // "react": "React",
    // "react-dom": "ReactDOM"
  },
};
