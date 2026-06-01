import { initLazyScript } from '../utils/theme-functions.js';
import { FlickityBreakpoints } from '../utils/flickity-breakpoints.js';

/**
 * FlickityResponsive Component
 * Automatically initializes Flickity carousels with responsive breakpoint support
 * 
 * Usage in Liquid:
 * <flickity-responsive>
 *   <div class="carousel" 
 *     data-flickity-base='{"cellAlign": "left"}'
 *     data-flickity-md='{"cellAlign": "center"}'>
 *     <!-- carousel cells -->
 *   </div>
 * </flickity-responsive>
 * 
 * Or use directly on any element with data-flickity-breakpoints attribute
 */
class FlickityResponsive extends HTMLElement {
  constructor() {
    super();
    initLazyScript(this, this.init.bind(this));
  }

  init() {
    // Find all carousels within this element that have Flickity data attributes
    const carousels = this.querySelectorAll('[data-flickity-base], [data-flickity-sm], [data-flickity-md], [data-flickity-lg], [data-flickity-xl], [data-flickity-breakpoints]');
    
    this.flickityInstances = [];
    
    carousels.forEach(carousel => {
      const instance = new FlickityBreakpoints(carousel);
      this.flickityInstances.push(instance);
    });
    
    // If this element itself has Flickity attributes, initialize it
    if (this.dataset.flickityBase || this.dataset.flickityBreakpoints) {
      const instance = new FlickityBreakpoints(this);
      this.flickityInstances.push(instance);
    }
  }

  disconnectedCallback() {
    // Clean up all Flickity instances
    this.flickityInstances?.forEach(instance => {
      instance.destroy();
    });
  }
}

// Register the custom element
customElements.define('flickity-responsive', FlickityResponsive);

/**
 * Auto-initialize any carousels with data-flickity-init="responsive"
 * This allows using the responsive system without a custom element wrapper
 */
document.addEventListener('DOMContentLoaded', () => {
  const responsiveCarousels = document.querySelectorAll('[data-flickity-init="responsive"]');
  
  responsiveCarousels.forEach(carousel => {
    initLazyScript(carousel, () => {
      new FlickityBreakpoints(carousel);
    });
  });
});

// Export for manual usage
export { FlickityResponsive };