#!/bin/bash

# Umami Chrome Extension Build Script
# This script builds and packages the extension optimally

# Display help information
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "Usage: ./build.sh [options]"
  echo "Options:"
  echo "  -h, --help     Display this help message"
  echo "  -d, --dev      Build development version (unminified)"
  echo "  -c, --clean    Clean build (remove dist directory first)"
  echo "  -p, --pack     Package extension as zip file after building"
  echo "  -s, --stats    Display webpack bundle stats analysis"
  exit 0
fi

# Default values
DEV_MODE=false
CLEAN_BUILD=false
PACK_EXTENSION=false
SHOW_STATS=false

# Process arguments
for arg in "$@"; do
  case $arg in
    -d|--dev)
      DEV_MODE=true
      shift
      ;;
    -c|--clean)
      CLEAN_BUILD=true
      shift
      ;;
    -p|--pack)
      PACK_EXTENSION=true
      shift
      ;;
    -s|--stats)
      SHOW_STATS=true
      shift
      ;;
  esac
done

# Print header
echo "📦 Building Umami Chrome Extension"
echo "=================================="

# Clean if requested
if [ "$CLEAN_BUILD" = true ]; then
  echo "🧹 Cleaning dist directory..."
  rm -rf dist
fi

# Set build mode
if [ "$DEV_MODE" = true ]; then
  BUILD_CMD="npx webpack --mode development"
  echo "🔧 Building in DEVELOPMENT mode..."
else
  BUILD_CMD="npx webpack --mode production"
  echo "🚀 Building in PRODUCTION mode..."
fi

# Add stats if requested
if [ "$SHOW_STATS" = true ]; then
  BUILD_CMD="$BUILD_CMD --json > stats.json"
  echo "📊 Will generate build stats..."
fi

# Run the build
echo "⚙️  Running build..."
eval $BUILD_CMD

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Display file sizes
echo "📏 Extension file sizes:"
du -sh dist
find dist -type f -name "*.js" -o -name "*.css" -o -name "*.html" | xargs du -sh

# Package if requested
if [ "$PACK_EXTENSION" = true ]; then
  echo "📦 Packaging extension..."
  cd dist
  ZIP_FILE="../umami-chrome-extension.zip"
  rm -f $ZIP_FILE
  zip -r $ZIP_FILE *
  cd ..
  echo "✅ Created package: umami-chrome-extension.zip ($(du -h umami-chrome-extension.zip | cut -f1))"
fi

echo "✅ Build complete!"

# Show stats if requested
if [ "$SHOW_STATS" = true ]; then
  echo "📊 Build stats generated. Run 'npx webpack-bundle-analyzer stats.json' to visualize."
fi

# Final instructions
echo ""
echo "📝 Next steps:"
echo "1. Load extension by selecting the 'dist' folder in Chrome's extension page"
echo "2. Make sure to select ONLY the 'dist' folder, not the entire project"
echo "" 