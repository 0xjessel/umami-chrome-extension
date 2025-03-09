const path = require('path');
const { Buffer } = require('buffer');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  watch: process.env.NODE_ENV === 'development',
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
  },
  entry: {
    background: './background.js',
    popup: './popup/popup.js',
    options: './options/options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: 'manifest.json',
          transform(content) {
            // This ensures the manifest is minified
            return Buffer.from(JSON.stringify(JSON.parse(content.toString())));
          }
        },
        { 
          from: 'icons', 
          to: 'icons',
          // Only copy png files from icons directory
          filter: (resourcePath) => resourcePath.endsWith('.png')
        },
        // Only copy essential source files that are actually needed at runtime
        // Consider importing needed modules directly in JS instead of copying entire src directory
        { 
          from: 'src',
          to: 'src',
          filter: (resourcePath) => {
            // Example filter - adjust based on what files are actually needed
            return resourcePath.endsWith('.js') && !resourcePath.includes('test') && !resourcePath.includes('.spec');
          }
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './popup/popup.html',
      filename: 'popup/popup.html',
      chunks: ['popup'],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    }),
    new HtmlWebpackPlugin({
      template: './options/options.html',
      filename: 'options/options.html',
      chunks: ['options'],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false, // Set to true in production to remove console logs
            passes: 2
          },
          mangle: true
        }
      })
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get the name of the npm package
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            // Return a minified name to reduce file size
            return `npm.${packageName.replace('@', '')}`;
          }
        }
      }
    }
  }
};
