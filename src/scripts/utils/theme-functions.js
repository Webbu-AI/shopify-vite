import { afterAnimationEnd, afterCallstack, debounce } from './utils.js';
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

//+ Configuration Constants
const CONFIG = {
    RESIZE_DEBOUNCE_DELAY: 300,
    BREAKPOINT_MOBILE: 850,
    BREAKPOINT_DESKTOP: 1024,
    SCROLL_BEHAVIOR_TIMEOUT: 1000,
    UNFOCUS_CLOSE_DELAY: 100,
    LAZY_SCRIPT_DEFAULT_THRESHOLD: 500,
    IOS_SCROLL_RESTORE_DELAY: 100
};

//+ Updating cart
document.addEventListener('cart:updated', (e) => {
    try {
        const itemCount = e.detail?.cart?.item_count;

        if (typeof itemCount === 'number') {
            updateCartLength(itemCount);
        } else {
            // Fallback to fetch if event data is invalid
            fetch('/cart.js')
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    if (typeof data.item_count === 'number') {
                        updateCartLength(data.item_count);
                    }
                })
                .catch((error) => {
                    console.error('Failed to update cart length:', error);
                });
        }
    } catch (error) {
        console.error('Error processing cart:updated event:', error);
    }
});

function updateCartLength(amount) {
    if (typeof amount !== 'number' || amount < 0) {
        console.warn('updateCartLength: Invalid amount provided', amount);
        return;
    }

    document.querySelectorAll('[data-cart-length]').forEach((el) => {
        if (el) {
            el.textContent = amount;
        }
    });
}

//+ Lazy Resize

/**
 * Dispatches a custom 'lazy:resize' event.
 */
function dispatchLazyResizeEvent(e) {
    const event = new Event('lazy:resize', e);
    window.dispatchEvent(event);
}
/**
 * Dispatches a custom 'breakpoint:crossed' event when the window width crosses 850px.
 */
function dispatchBreakpointCrossedEvent() {
    const width = window.innerWidth;
    const isMobile = width <= CONFIG.BREAKPOINT_MOBILE;

    // Check if the breakpoint has been crossed
    if (window.isMobile !== isMobile) {
        window.isMobile = isMobile;
        const event = new CustomEvent('breakpoint:crossed', {
            detail: { width: width, isMobile: isMobile }
        });
        window.dispatchEvent(event);
    }
}

// Add a debounced event listener for the 'resize' event
window.addEventListener(
    'resize',
    debounce(() => {
        dispatchLazyResizeEvent();
        dispatchBreakpointCrossedEvent();
    }, CONFIG.RESIZE_DEBOUNCE_DELAY)
);

dispatchBreakpointCrossedEvent();

//+ Script Loaded Event

function handleScriptLoad(event) {
    const scriptSrc = event.target.src;

    if (!scriptSrc || typeof scriptSrc !== 'string' || scriptSrc.trim() === '') {
        return;
    }

    try {
        const url = new URL(scriptSrc);
        const scriptName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        document.dispatchEvent(
            new CustomEvent('script:loaded', { detail: { src: scriptSrc, name: scriptName } })
        );
        document.dispatchEvent(
            new CustomEvent(`script:loaded:${scriptName}`, {
                detail: { src: scriptSrc, name: scriptName }
            })
        );
    } catch (e) {
        console.error(`handleScriptLoad: Failed to parse URL '${scriptSrc}'. Error:`, e, event.target);
    }
}

document.querySelectorAll('script').forEach((script) => {
    script.addEventListener('load', handleScriptLoad);
});

/* Lazy Init Script */

/**
 * Adds an observer to initialise a script when an element is scrolled into view.
 * @param {Element} element - Element to observe.
 * @param {Function} callback - Function to call when element is scrolled into view.
 * @param {number} [threshold=500] - Distance from viewport (in pixels) to trigger init.
 */
export function initLazyScript(element, callback, threshold = CONFIG.LAZY_SCRIPT_DEFAULT_THRESHOLD) {
    // Input validation
    if (!element || !(element instanceof Element)) {
        console.warn('initLazyScript: Invalid element provided');
        return;
    }

    if (typeof callback !== 'function') {
        console.warn('initLazyScript: Invalid callback provided');
        return;
    }

    if (typeof threshold !== 'number' || threshold < 0) {
        console.warn('initLazyScript: Invalid threshold, using default');
        threshold = CONFIG.LAZY_SCRIPT_DEFAULT_THRESHOLD;
    }

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        afterCallstack(() => {
                            callback();
                            observer.unobserve(entry.target);
                        });
                    }
                });
            },
            { rootMargin: `0px 0px ${threshold}px 0px` }
        );

        io.observe(element);
    } else {
        afterCallstack(() => {
            callback(element);
        });
    }
}

window.initLazyScript = initLazyScript;

//+  Only open one details at a time

function initMaxOpenDetails() {
    const containers = document.querySelectorAll('[data-max-open-one]');

    containers.forEach((container) => {
        const detailsElements = container.querySelectorAll('details');

        detailsElements.forEach((details) => {
            details.addEventListener('toggle', () => {
                if (details.open) {
                    // Find the immediate parent of this details element
                    const immediateParent = details.parentElement;

                    // Only close sibling details that share the same immediate parent
                    const siblingDetails = Array.from(immediateParent.children).filter(
                        (child) => child.tagName === 'DETAILS' && child !== details
                    );

                    siblingDetails.forEach((siblingDetail) => {
                        siblingDetail.open = false;
                    });
                }
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', initMaxOpenDetails);

//+  Close details on click outside

function initCloseOnUnfocus() {
    const details = document.querySelectorAll('[data-unfocus-close]');

    details.forEach((details) => {
        details.setAttribute('tabindex', '-1');

        details.addEventListener('focusout', (evt) => {
            setTimeout(() => {
                if (!details.contains(document.activeElement)) {
                    details.open = false;
                }
            }, CONFIG.UNFOCUS_CLOSE_DELAY);
        });
    });
}

document.addEventListener('DOMContentLoaded', initCloseOnUnfocus);

//+ External Links

function initExternalLinks() {
    document.addEventListener('click', (evt) => {
        const link = evt.target.tagName === 'A' ? evt.target : evt.target.closest('a');
        if (link && link.tagName === 'A' && window.location.hostname !== new URL(link.href).hostname) {
            link.target = '_blank';
        }
    });
}

document.addEventListener('DOMContentLoaded', initExternalLinks);

//+ Anchor Scrolling

function initAnchorScrolling() {
    // Ensure anchor scrolling is smooth (this shouldn't be added in the CSS)
    document.addEventListener('click', (evt) => {
        if (
            evt.target.tagName === 'A' &&
            window.location.hostname === new URL(evt.target.href).hostname &&
            evt.target.href.includes('#')
        ) {
            document.getElementsByTagName('html')[0].style.scrollBehavior = 'smooth';
            setTimeout(() => {
                document.getElementsByTagName('html')[0].style.scrollBehavior = '';
            }, CONFIG.SCROLL_BEHAVIOR_TIMEOUT);
        }
    });
}

document.addEventListener('DOMContentLoaded', initAnchorScrolling);

//! Lock Body Scroll

// Track which elements have scroll locked
const lockedElements = new Set();

export function lockBodyScroll(element) {
    // If no element specified, use body as default
    const targetElement = element || document.body;

    // Save current scroll position before first lock
    if (lockedElements.size === 0) {
        window.unlockedScrollY = window.scrollY;
    }

    // Lock the scroll on the target element
    disableBodyScroll(targetElement, {
        reserveScrollBarGap: true, // Prevents layout shift by adding padding
        allowTouchMove: (el) => {
            // Allow scrolling within certain elements if needed
            while (el && el !== document.body) {
                if (el.getAttribute('data-allow-scroll') !== null) {
                    return true;
                }
                el = el.parentElement;
            }
            return false;
        }
    });

    // Track this element as locked
    lockedElements.add(targetElement);
}

export function unlockBodyScroll(element) {
    const targetElement = element || document.body;

    // Enable scroll for the specific element
    enableBodyScroll(targetElement);

    // Remove from tracking
    lockedElements.delete(targetElement);

    // If all locks are released, restore scroll position
    if (lockedElements.size === 0 && typeof window.unlockedScrollY === 'number') {
        const scrollY = window.unlockedScrollY;
        window.scrollTo(0, scrollY);
        delete window.unlockedScrollY;
    }
}

// Clean up all locks (useful for cleanup)
export function clearAllScrollLocks() {
    clearAllBodyScrollLocks();
    lockedElements.clear();
    delete window.unlockedScrollY;
}
