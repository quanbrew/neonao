const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'development',
  // Enable sourcemaps for debugging webpack's output.
  devtool: "inline-source-map",
  devServer: {
    contentBase: './public',
    hot: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new BundleAnalyzerPlugin(),
  ],
});
