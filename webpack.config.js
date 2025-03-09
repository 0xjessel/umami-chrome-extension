const path = require('path');
const { Buffer } = require('buffer');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

// Custom plugin to ensure all chunks are available in subdirectories
class EnsureChunksPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('EnsureChunksPlugin', (compilation, callback) => {
      const outputPath = compilation.outputOptions.path;
      const targetDirs = ['options', 'popup'];
      
      // Find all JS files in the root directory
      const jsFiles = fs.readdirSync(outputPath)
        .filter(file => file.endsWith('.js') && !['background.js', 'options.js', 'popup.js'].includes(file));
      
      // Copy each JS file to each target directory
      jsFiles.forEach(file => {
        const srcPath = path.join(outputPath, file);
        
        targetDirs.forEach(dir => {
          const destDir = path.join(outputPath, dir);
          const destPath = path.join(destDir, file);
          
          // Make sure the directory exists
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          // Copy the file if it doesn't exist in the destination directory
          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied ${file} to ${dir}/`);
          }
        });
      });
      
      callback();
    });
  }
}

// Custom plugin to fix HTML file paths
class FixHtmlPathsPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('FixHtmlPathsPlugin', (compilation, callback) => {
      const outputPath = compilation.outputOptions.path;
      
      // Fix options.html
      const optionsHtmlPath = path.join(outputPath, 'options', 'options.html');
      if (fs.existsSync(optionsHtmlPath)) {
        let html = fs.readFileSync(optionsHtmlPath, 'utf8');
        // Fix paths by removing directory prefix
        html = html.replace(/src="\.\/options\//g, 'src="./');
        html = html.replace(/href="\.\/options\//g, 'href="./');
        fs.writeFileSync(optionsHtmlPath, html);
        console.log('Fixed paths in options.html');
      }
      
      // Fix popup.html
      const popupHtmlPath = path.join(outputPath, 'popup', 'popup.html');
      if (fs.existsSync(popupHtmlPath)) {
        let html = fs.readFileSync(popupHtmlPath, 'utf8');
        // Fix paths by removing directory prefix
        html = html.replace(/src="\.\/popup\//g, 'src="./');
        html = html.replace(/href="\.\/popup\//g, 'href="./');
        fs.writeFileSync(popupHtmlPath, html);
        console.log('Fixed paths in popup.html');
      }
      
      callback();
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
      publicPath: './',
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
      publicPath: './',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: false,
        useShortDoctype: true
      }
    }),
    new MiniCssExtractPlugin({
      filename: (pathData) => {
        return pathData.chunk.name === 'background' 
          ? '[name].css'
          : `${pathData.chunk.name}/[name].css`;
      }
    }),
    new EnsureChunksPlugin(),
    new FixHtmlPathsPlugin()
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
      // Disable the automatic creation of the commons chunk
      // This will cause each entry point to get its own complete bundle
      cacheGroups: {
        defaultVendors: false,
        default: false
      }
    }
  }
};
