import fs from 'node:fs';
import deepmerge from 'deepmerge';

const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));

const isFirefox = process.env.__FIREFOX__ === 'true';

/**
 * If you want to disable the sidePanel, you can delete withSidePanel function and remove the sidePanel HoC on the manifest declaration.
 *
 * ```js
 * const manifest = { // remove `withSidePanel()`
 * ```
 */
function withSidePanel(manifest) {
  // Firefox does not support sidePanel
  if (isFirefox) {
    return manifest;
  }
  return deepmerge(manifest, {
    side_panel: {
      default_path: 'side-panel/index.html',
    },
    permissions: ['sidePanel'],
  });
}

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = withSidePanel({
  manifest_version: 3,
  default_locale: 'en',
  /**
   * if you want to support multiple languages, you can use the following reference
   * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
   */
  name: '__MSG_extensionName__',
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  host_permissions: ['<all_urls>', 'https://www.googleapis.com/*'],
  permissions: ['storage', 'scripting', 'tabs', 'activeTab', 'debugger', 'identity'],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.iife.js',
    type: 'module',
  },
  action: {
    default_icon: 'icon-32.png',
  },
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['content/index.iife.js'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-32.png'],
      matches: ['*://*/*'],
    },
  ],
  oauth2: {
    client_id: '595477922628-qdih86kuv9j9e9mm0unhjspr002nlsku.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
  },
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuDF61rbOZ/998psoFAueiYiGsLIX6Ql4P2GUTuE+ixZ8DfzMUJUsothK84BUKJhrSaXyBm7sGs4aTwS8qTJya9OJ8ooLnVwKNnIThPVHTv21K6EupoLULCFixneM5a8in35uCkA2EFNxAqm8PsTSM/fBfluGPl19lP78KFrVF2dC8OjFQO8id2Ft74bhj95VrZThTsgmJsaP39Zu+5NC0OThjSHbNCVuN+aHX9gWh0l+eQppDKAbxL9+JqwCmZhkM/vN36hTLTpttdiB10ciX2sMCXskTLXfdoNMK7igvu9BCcF9L19AOFOiotZn2u6LSW0lNq9xJDIvkmu0UOEArQIDAQAB',
});
export default manifest;
