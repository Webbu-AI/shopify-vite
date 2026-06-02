// Initialize theme object
window.theme = window.theme || {};

import '../scripts/utils/theme-functions.js';
import '../scripts/utils/drawer-toggle.js';
import '../scripts/utils/helpers';
import '../scripts/components/';

document.dispatchEvent(new CustomEvent('theme:loaded'));
window.theme.loaded = true;
