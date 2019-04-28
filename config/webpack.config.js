'use strict';
// https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const devtool = isDev ? 'inline-source-map' : false;
const mode = isDev ? 'development' : 'production';
const styleLoader = isDev ? 'style-loader' : MiniCssExtractPlugin.loader;

let plugins = [
  new CleanWebpackPlugin(),
  new webpack.HashedModuleIdsPlugin(),
  new HtmlWebpackPlugin({
    template: 'public/index.html',
    inject: true,
    favicon: 'public/logo.svg.png',
    minify: 'production',
  }),
];

if (process.env.ANALYZE) {
  plugins.push(new BundleAnalyzerPlugin());
}
if (isDev) {
  plugins.push(new webpack.HotModuleReplacementPlugin());
} else {
  plugins.push(
    new OptimizeCSSAssetsPlugin({}),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
    })
  );
}

const rootPath = path.resolve(__dirname, '../');

module.exports = {
  entry: './src/index.tsx',
  mode,
  devtool,
  plugins,
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(rootPath, 'dist'),
  },

  devServer: {
    contentBase: './public',
    hot: true,
    historyApiFallback: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.wasm'],
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: 'ts-loader' },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },

      {
        test: /\.css$/,
        use: [styleLoader, 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/, // .sass or .scss
        use: [styleLoader, 'css-loader', 'sass-loader'],
      },

      { test: /\.(png|svg|jpg|gif)$/, use: ['file-loader'] },
    ],
  },

  optimization: {
    // https://webpack.js.org/plugins/split-chunks-plugin/
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
      //   chunks: 'all',
      //   minSize: 40000,
      //   maxSize: 140000,
    },
    // runtimeChunk: 'single',
  },
  externals: {
    // "react": "React",
    // "react-dom": "ReactDOM"
  },
};
