# Umami Analytics Chrome Extension

A Chrome extension that provides real-time analytics from your Umami dashboard directly in your browser. Monitor active users, page views, and visitor statistics without leaving your current tab.

## Features

- 🔄 Real-time metrics display with instant updates (validated for self-hosted servers)
- 👥 Active users counter
- 📊 Daily page views and visitor statistics with trend indicators
- 🎯 Configurable badge updates with customizable polling intervals
- 🔒 Secure credential storage with robust self-hosted authentication
- ⚡ Lightweight and performant with optimized API calls
- 🎨 Modern, responsive UI with dark mode support
- 🌐 Primary focus on self-hosted Umami server support

## Installation

### Quick Install (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) *(Coming soon)*
2. Click "Add to Chrome"
3. Follow the configuration steps below to set up your credentials

> **Recommended:** This extension is optimized and validated for self-hosted Umami servers. If you're using Umami Cloud, some features may not work as expected.

### Developer Install

1. Clone the repository:
```bash
git clone https://github.com/0xjessel/umami-chrome-extension.git
cd umami-chrome-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build  # For production build
# or
npm run dev    # For development with hot reload
```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` directory
   - The extension icon should appear in your toolbar

## Configuration

> **Note:** Currently, only the self-hosted server type has been tested and validated to work. Cloud server support is planned but not yet fully tested.

1. Click the extension icon and select "Settings" or right-click and choose "Options"
2. Enter your Umami credentials:
   - For Umami Cloud:
     - Select "Cloud" as your server type
     - Enter your API key (found in your Umami Cloud account settings)
     - Enter your Website ID (found in website settings)
   - For Self-hosted Umami:
     - Select "Self-hosted" as your server type
     - Enter your Umami server URL
     - Enter your username and password
     - Enter your Website ID (found in website settings)
3. Configure display settings:
   - Choose what metric to show in the extension badge (active users, views, or visitors)
   - Set your preferred update interval
   - Enable/disable dark mode

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup Development Environment

1. Install dependencies:
```bash
npm install
```

2. Start development build with watch mode:
```bash
npm run dev
```

3. Load unpacked extension from the `dist` directory

### Available Scripts

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode
- `npm run lint` - Lint JavaScript files
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Project Structure

```
umami-chrome-extension/
├── manifest.json        # Extension manifest
├── background.js       # Service worker for badge updates
├── popup/             # Extension popup UI
│   ├── popup.html     # Popup layout and structure
│   ├── popup.js      # Real-time metrics display logic
│   └── popup.css     # Popup styling with dark mode
├── options/          # Settings page
│   ├── options.html  # Settings form layout
│   ├── options.js    # Credentials and display settings
│   └── options.css   # Settings page styling
├── src/             # Shared code
│   ├── api.js       # Umami API client with cloud/self-hosted support
│   ├── storage.js   # Chrome storage manager for settings
│   └── constants.js # Shared constants and configurations
└── tests/          # Test suite
    └── api.test.js  # API client tests
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

- Credentials are stored securely using Chrome's Storage API with encryption
- Support for both API key (cloud) and username/password (self-hosted) authentication
- All API requests are made over HTTPS with proper error handling
- Authentication tokens are never exposed in logs or error messages
- Connection verification before saving credentials
- Automatic token refresh for self-hosted servers
- Regular security audits of dependencies
- Clear separation between cloud and self-hosted authentication flows

## Privacy

This extension is designed with privacy in mind:

- Only accesses analytics data from your configured Umami dashboard
- Communicates exclusively with your specified Umami server (cloud or self-hosted)
- No tracking of browsing history or behavior
- No collection of personal information
- No third-party analytics or tracking
- All data stays between the extension and your Umami server
- Badge and popup only show aggregate statistics
- Credentials are stored locally and never shared

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Umami](https://umami.is/) - Open source analytics platform
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/mv3/)

## Troubleshooting

### Common Issues

1. **Failed to initialize API**
   - Verify your server URL is correct and includes the protocol (http:// or https://)
   - For self-hosted (recommended): Check your username and password
   - For cloud (experimental): Make sure your API key is correct
   - Ensure your Website ID is correct

2. **Badge not updating**
   - Check if your credentials are still valid
   - Try clicking the refresh button in the popup
   - Verify your polling interval settings

3. **Extension showing no data**
   - Confirm you have active traffic on your website
   - Check if your Umami server is collecting data properly
   - Try reopening the popup

