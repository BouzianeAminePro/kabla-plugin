# Kabla.js: How to Use Guide

Kabla.js is a powerful library designed to track user interactions on your website and send relevant information to your backend server. This guide will walk you through setting up and using Kabla.js effectively.

## Table of Contents

- [Setup](#setup)
- [Configuration](#configuration)
- [Initialization](#initialization)
- [Tracking Events](#tracking-events)
- [Advanced Usage](#advanced-usage)

## Setup

First, install Kabla.js via npm:

```bash
npm install kabla
```

Then, import the necessary functions into your project:

```javascript
import { kabla, useKabla } from 'kabla';
import { Configuration } from 'kabla/types';
```

## Configuration

Create a configuration object to customize the behavior of Kabla.js. Below is an example configuration with all available options:

```javascript
const configuration: Configuration = {
  apiConfig: {
    siteId: 'your-site-id',
    apiKey: 'your-api-key',
  },
  disable: false, // Set to true to disable Kabla.js
  bulkData: true, // Set to false to disable bulk data collection
  blackList: ['/excluded-path'], // Paths to exclude from tracking
  ctaList: ['.cta-button'], // CSS selectors for call-to-action elements
};
```

### Configuration Options

- `apiConfig`: Contains `siteId` and `apiKey` for backend authentication.
- `disable`: Boolean to enable or disable Kabla.js.
- `bulkData`: Boolean to enable or disable bulk data collection.
- `blackList`: Array of URL paths to exclude from tracking.
- `ctaList`: Array of CSS selectors for call-to-action elements.

## Initialization

To initialize Kabla.js, call the `kabla` function with your configuration object:

```javascript
kabla(configuration);
```

Alternatively, you can use the `useKabla` function, which is a wrapper around `kabla`:

```javascript
useKabla(configuration);
```

## Tracking Events

Kabla.js automatically tracks various user interactions such as page visits and clicks on call-to-action elements specified in the `ctaList`.

### Page Visits

Kabla.js monitors page visits and sends the collected data to the backend when the user leaves the page or when the page visibility changes.

### Call-to-Action Elements

To track clicks on specific elements, add their CSS selectors to the `ctaList` in your configuration. For example:

```javascript
ctaList: ['.cta-button', '#special-offer'],
```

## Advanced Usage

### Handling Visitor UID

Kabla.js checks for a unique visitor ID (`uid`) in cookies. If not found, it generates one using the `uuidv4` library and sets it as a cookie.

### Sending Information

Kabla.js sends collected data to the backend using the `sendInformation` function. The data includes visitor ID, site ID, and other interaction details.

### Pathname Changes

Kabla.js uses a `MutationObserver` to detect changes in the document's pathname. When a change is detected, it re-triggers event listeners for the new path.

## Conclusion

By following this guide, you can effectively integrate Kabla.js into your project to track user interactions and gather valuable data for analysis. For more detailed information and advanced configurations, refer to the source code and comments within the modules.