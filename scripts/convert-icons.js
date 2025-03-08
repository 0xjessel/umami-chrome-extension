const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const sizes = [16, 32, 48, 128];
const inputFile = path.join(__dirname, '..', 'icons', 'logo.svg');
const outputDir = path.join(__dirname, '..', 'icons');

async function convertIcons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Convert SVG to each required size
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon${size}.png`);
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      console.log(`Created ${outputFile}`);
    }
  } catch (error) {
    console.error('Error converting icons:', error);
    process.exit(1);
  }
}

convertIcons();
