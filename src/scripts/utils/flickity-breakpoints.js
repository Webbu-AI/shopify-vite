/**
 * Flickity Breakpoints Utility
 * Enables responsive Flickity options based on screen breakpoints
 * Can be used throughout the theme for any Flickity carousel
 */

export class FlickityBreakpoints {
    constructor(element, breakpointOptions = {}) {
        if (!element) {
            throw new Error('FlickityBreakpoints requires a valid DOM element');
        }

        this.element = element;
        this.flkty = null;
        this.resizeTimer = null;
        this.currentBreakpoint = null;

        // Default breakpoints matching Tailwind's breakpoints
        this.breakpoints = {
            base: 0, // Mobile first
            sm: 640, // Small devices
            md: 768, // Medium devices
            lg: 1024, // Large devices
            xl: 1280, // Extra large devices
            '2xl': 1536 // 2X large devices
        };

        // Parse breakpoint options from data attribute or use provided options
        this.breakpointOptions = this.parseBreakpointOptions(breakpointOptions);

        this.init();
    }

    /**
     * Parse breakpoint options from element's data attribute or provided options
     */
    parseBreakpointOptions(providedOptions) {
        // Check for data-flickity-breakpoints attribute
        const dataOptions = this.element.dataset.flickityBreakpoints;

        if (dataOptions) {
            // Handle "none" as a special case
            if (dataOptions === 'none') {
                return { base: 'none' };
            }
            try {
                return JSON.parse(dataOptions);
            } catch (e) {
                console.warn('Invalid JSON in data-flickity-breakpoints:', e);
            }
        }

        // Check for individual data-flickity-[breakpoint] attributes
        const breakpointData = {};
        Object.keys(this.breakpoints).forEach((bp) => {
            const attrName = `flickity${bp.charAt(0).toUpperCase() + bp.slice(1)}`;
            const attrValue = this.element.dataset[attrName];

            if (attrValue) {
                // Handle "none" as a special case
                if (attrValue === 'none') {
                    breakpointData[bp] = 'none';
                } else {
                    try {
                        breakpointData[bp] = JSON.parse(attrValue);
                    } catch (e) {
                        console.warn(`Invalid JSON in data-${attrName}:`, e);
                    }
                }
            }
        });

        // Merge all options (provided options take precedence)
        return Object.assign({}, breakpointData, providedOptions);
    }

    /**
     * Get the current breakpoint based on window width
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        let currentBreakpoint = 'base';

        // Find the largest breakpoint that matches
        Object.entries(this.breakpoints)
            .sort(([, a], [, b]) => b - a) // Sort by value descending
            .forEach(([name, minWidth]) => {
                if (width >= minWidth && this.breakpointOptions[name]) {
                    currentBreakpoint = name;
                }
            });

        return currentBreakpoint;
    }

    /**
     * Get merged options for current breakpoint
     */
    getCurrentOptions() {
        let options = {};

        // Start with base options if they exist
        if (this.breakpointOptions.base) {
            // Check if base options is "none"
            if (this.breakpointOptions.base === 'none') {
                return null;
            }
            options = { ...this.breakpointOptions.base };
        }

        // Apply options from smaller to larger breakpoints (mobile-first)
        const sortedBreakpoints = Object.entries(this.breakpoints).sort(([, a], [, b]) => a - b); // Sort by value ascending

        for (const [name, minWidth] of sortedBreakpoints) {
            if (window.innerWidth >= minWidth && this.breakpointOptions[name]) {
                // Check if current breakpoint options is "none"
                if (this.breakpointOptions[name] === 'none') {
                    return null;
                }
                options = { ...options, ...this.breakpointOptions[name] };
            }
        }

        return options;
    }

    /**
     * Initialize Flickity with responsive options
     */
    init() {
        if (typeof Flickity === 'undefined') {
            console.warn('Flickity is not loaded');
            return;
        }

        this.initFlickity();
        this.setupResizeListener();
    }

    /**
     * Initialize or reinitialize Flickity
     */
    initFlickity() {
        const options = this.getCurrentOptions();
        this.currentBreakpoint = this.getCurrentBreakpoint();

        // If options is null, it means Flickity should be disabled
        if (options === null) {
            if (this.flkty) {
                // Destroy existing instance
                this.flkty.destroy();
                this.flkty = null;
            }
            return;
        }

        if (this.flkty) {
            // Store the current selected index
            const selectedIndex = this.flkty.selectedIndex;

            // Destroy existing instance
            this.flkty.destroy();

            // Reinitialize with new options
            this.flkty = new Flickity(this.element, options);

            // Try to restore the selected index
            if (selectedIndex !== undefined && selectedIndex < this.flkty.cells.length) {
                this.flkty.select(selectedIndex, false, true);
            }
        } else {
            // First initialization
            this.flkty = new Flickity(this.element, options);
        }
    }

    /**
     * Setup resize listener for responsive behavior
     */
    setupResizeListener() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const newBreakpoint = this.getCurrentBreakpoint();

        // Only reinitialize if breakpoint has changed
        if (newBreakpoint !== this.currentBreakpoint) {
            this.initFlickity();
        }
    }

    /**
     * Destroy the Flickity instance and remove listeners
     */
    destroy() {
        if (this.flkty) {
            this.flkty.destroy();
            this.flkty = null;
        }

        // Note: We're not removing the resize listener as it might be shared
        // In a production environment, you might want to track and remove it
    }

    /**
     * Get the Flickity instance
     */
    getFlickity() {
        return this.flkty;
    }
}

/**
 * Initialize Flickity with breakpoints on an element
 * Can be called directly or used with custom elements
 */
export function initFlickityBreakpoints(element, options = {}) {
    return new FlickityBreakpoints(element, options);
}

// Make it available globally for inline usage
window.FlickityBreakpoints = FlickityBreakpoints;
window.initFlickityBreakpoints = initFlickityBreakpoints;
