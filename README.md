# Umami Analytics Chrome Extension

A Chrome extension that provides real-time analytics from your self-hosted Umami dashboard directly in your browser. Monitor active users, page views, and visitor statistics without leaving your current tab.

## Features

- 🔄 Real-time metrics display with instant updates
- 👥 Active users counter
- 📊 Daily page views and visitor statistics with trend indicators
- 🎯 Configurable badge updates with customizable polling intervals
- 🔒 Secure credential storage with robust authentication
- ⚡ Lightweight and performant with optimized API calls
- 🎨 Modern, responsive UI with dark mode support
- 🌐 Designed specifically for self-hosted Umami servers

## Installation

### Quick Install (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) _(Coming soon)_
2. Click "Add to Chrome"
3. Follow the configuration steps below to set up your credentials

> **Note:** This extension only supports self-hosted Umami servers. It does not support Umami Cloud.

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

1. Click the extension icon and select "Settings" or right-click and choose "Options"
2. Enter your Umami credentials:
   - Enter your self-hosted Umami server URL
   - Enter your username and password
   - Enter your Website ID (found in website settings)
3. Configure display settings:
   - Choose what metric to show in the extension badge (active users, views, or visitors)
   - Set your preferred update interval
   - Select which metrics to display in the popup

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
│   ├── api.js       # Umami API client for self-hosted servers
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
- All API requests are made over HTTPS with proper error handling
- Authentication tokens are never exposed in logs or error messages
- Connection verification before saving credentials
- Automatic token refresh for expired authentication
- Regular security audits of dependencies

## Privacy

This extension is designed with privacy in mind:

- Only accesses analytics data from your configured Umami dashboard
- Communicates exclusively with your specified self-hosted Umami server
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
   - Check your username and password
   - Ensure your Website ID is correct

2. **Badge not updating**

   - Check if your credentials are still valid
   - Try clicking the refresh button in the popup
   - Verify your polling interval settings

3. **Extension showing no data**
   - Confirm you have active traffic on your website
   - Check if your Umami server is collecting data properly
   - Try reopening the popup
