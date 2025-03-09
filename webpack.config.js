const path = require('path');
const { Buffer } = require('buffer');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

// Custom plugin to copy shared chunks to subdirectories
class CopyChunksPlugin {
  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    // After the assets are emitted to the output directory
    compiler.hooks.done.tap('CopyChunksPlugin', stats => {
      const outputPath = compiler.options.output.path;
      const subdirectories = this.options.subdirectories || [];
      const ignoreFiles = this.options.ignoreFiles || [];
      
      if (!fs.existsSync(outputPath)) {
        console.error(`Output path ${outputPath} does not exist!`);
        return;
      }
      
      // Get all JS files in the output directory
      const files = fs.readdirSync(outputPath)
        .filter(file => file.endsWith('.js') && !ignoreFiles.some(ignore => file.includes(ignore)));
      
      // Copy each shared JS file to each subdirectory
      files.forEach(file => {
        const filePath = path.join(outputPath, file);
        
        subdirectories.forEach(dir => {
          const targetDir = path.join(outputPath, dir);
          const targetPath = path.join(targetDir, file);
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          // Copy the file
          fs.copyFileSync(filePath, targetPath);
          console.log(`Copied ${file} to ${path.relative(outputPath, targetPath)}`);
        });
      });
    });
  }
}

module.exports = {
  watch: process.env.NODE_ENV === 'development',
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
  },
  devtool: 'nosources-source-map',
  experiments: {
    outputModule: true
  },
  entry: {
    background: './background.js',
    popup: './popup/popup.js',
    options: './options/options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    module: true,
    environment: {
      arrowFunction: true,
      bigIntLiteral: false,
      const: true,
      destructuring: true,
      dynamicImport: true,
      forOf: true,
      module: true
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
      // Ensure HTML files preserve ES module scripts
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: {
                removeScriptTypeAttributes: false, // Preserve script type attributes
                collapseWhitespace: true,
                removeComments: true
              }
            }
          }
        ]
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
      publicPath: '../',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: false,
        useShortDoctype: true
      }
    }),
    new HtmlWebpackPlugin({
      template: './options/options.html',
      filename: 'options/options.html',
      chunks: ['options'],
      publicPath: '../',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: false,
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
            drop_console: true, // Remove all console logs in production builds
            passes: 2
          },
          mangle: true,
          // Ensure Terser doesn't use unsafe transformations
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
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get the name of the npm package
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            // Return a minified name to reduce file size
            return `npm.${packageName.replace('@', '')}`;
          }
        },
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
  }
};
