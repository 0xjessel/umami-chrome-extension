const path = require('path');
const { Buffer } = require('buffer');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

module.exports = {
  watch: process.env.NODE_ENV === 'development',
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
  },
  devtool: 'nosources-source-map',
  experiments: {
    outputModule: false
  },
  entry: {
    background: './background.js',
    popup: './popup/popup.js',
    options: './options/options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      return pathData.chunk.name === 'background' 
        ? '[name].js'
        : `${pathData.chunk.name}/[name].js`;
    },
    chunkFilename: (pathData) => {
      const issuer = pathData.chunk.modules?.[0]?.issuerPath?.[0]?.name || '';
      
      if (issuer.includes('popup')) {
        return 'popup/[id].js';
      } else if (issuer.includes('options')) {
        return 'options/[id].js';
      } else {
        return '[id].js';
      }
    },
    clean: true,
    module: false,
    environment: {
      arrowFunction: true,
      bigIntLiteral: false,
      const: true,
      destructuring: true,
      dynamicImport: true,
      forOf: true,
      module: false
    }
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
      },
      // Don't process HTML with html-loader to preserve our manual script tags
      {
        test: /\.html$/,
        type: 'asset/resource',
        generator: {
          filename: ({ filename }) => {
            // Strip the source directory from the filename
            const parts = filename.split('/');
            return parts.length > 1 ? `${parts[0]}/${parts[parts.length - 1]}` : filename;
          }
        }
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
          filter: (resourcePath) => resourcePath.endsWith('.png')
        },
        { 
          from: 'src',
          to: 'src',
          filter: (resourcePath) => {
            return resourcePath.endsWith('.js') && !resourcePath.includes('test') && !resourcePath.includes('.spec');
          }
        },
        // Copy HTML files directly without processing
        {
          from: 'popup/popup.html',
          to: 'popup/popup.html'
        },
        {
          from: 'options/options.html',
          to: 'options/options.html'
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: (pathData) => {
        return pathData.chunk.name === 'background' 
          ? '[name].css'
          : `${pathData.chunk.name}/[name].css`;
      }
    }),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            passes: 2
          },
          mangle: true,
          ecma: 2020,
          module: true,
          toplevel: true,
          keep_classnames: false,
          keep_fnames: false
        }
      })
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        defaultVendors: false,
        default: false
      }
    }
  }
};
