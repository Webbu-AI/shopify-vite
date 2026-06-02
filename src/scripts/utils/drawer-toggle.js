/**
 * Global drawer/aside toggle.
 *
 * Wires up any element with a `data-toggle-{name}` attribute so that clicking
 * it toggles the `open` attribute on the matching `<{name}-drawer>` element
 * (and on `<div data-drawer="{name}">` for non-component drawers, e.g. menu).
 *
 * Patterns supported:
 *   data-toggle-menu  →  [data-drawer="menu"]
 *   data-toggle-cart  →  cart-drawer
 *   data-toggle-search →  search-drawer
 *
 * Esc closes the topmost open drawer. Overlay click closes its drawer.
 */

import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

const TOGGLE_PREFIX = 'toggle';

function findDrawerFor(name) {
    return (
        document.querySelector(`${name}-drawer`) ||
        document.querySelector(`[data-drawer="${name}"]`)
    );
}

function getToggleName(el) {
    if (!el || !el.dataset) return null;
    for (const key of Object.keys(el.dataset)) {
        if (key.length > TOGGLE_PREFIX.length && key.startsWith(TOGGLE_PREFIX)) {
            return key.slice(TOGGLE_PREFIX.length).toLowerCase();
        }
    }
    return null;
}

function openDrawer(drawer, trigger) {
    if (!drawer || drawer.hasAttribute('open')) return;
    drawer._trigger = trigger || document.activeElement;
    drawer.setAttribute('open', '');
    document.body.classList.add('overflow-hidden');
    const scrollTarget = drawer.querySelector('.overflow-y-auto') || drawer;
    disableBodyScroll(scrollTarget);
    drawer.dispatchEvent(new CustomEvent('drawer:open', { bubbles: true }));
}

function closeDrawer(drawer) {
    if (!drawer || !drawer.hasAttribute('open')) return;
    drawer.removeAttribute('open');
    const scrollTarget = drawer.querySelector('.overflow-y-auto') || drawer;
    enableBodyScroll(scrollTarget);
    if (!document.querySelector('.drawer[open]')) {
        document.body.classList.remove('overflow-hidden');
    }
    drawer.dispatchEvent(new CustomEvent('drawer:close', { bubbles: true }));
    drawer._trigger?.focus?.();
    drawer._trigger = null;
}

function toggleDrawer(drawer, trigger) {
    if (!drawer) return;
    drawer.hasAttribute('open') ? closeDrawer(drawer) : openDrawer(drawer, trigger);
}

document.addEventListener('click', (event) => {
    const toggleEl = event.target.closest('button, a, [data-toggle-menu], [data-toggle-cart], [data-toggle-search]');
    if (!toggleEl) return;

    const name = getToggleName(toggleEl);
    if (!name) return;

    const drawer = findDrawerFor(name);
    if (!drawer) return;

    event.preventDefault();
    toggleDrawer(drawer, toggleEl);
});

document.addEventListener('keyup', (event) => {
    if (event.key !== 'Escape') return;
    const openDrawers = document.querySelectorAll('.drawer[open]');
    if (openDrawers.length === 0) return;
    closeDrawer(openDrawers[openDrawers.length - 1]);
});

document.addEventListener('drawer:open', (event) => {
    const drawer = event.target;
    const input = drawer.querySelector('input[type="search"]');
    if (input) setTimeout(() => input.focus(), 350);
});

export { openDrawer, closeDrawer, toggleDrawer, findDrawerFor };
