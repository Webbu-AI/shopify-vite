import { initLazyScript } from '../../utils/theme-functions';

class ProductCard extends HTMLElement {
    constructor() {
        super();
        initLazyScript(this, this.init.bind(this));
    }

    init() {
        this.images = this.querySelectorAll('.card__main-image');
        this.links = this.querySelectorAll('.js-prod-link');
        this.quickAddBtn = this.querySelector('.js-quick-add');

        if (this.quickAddBtn) {
            this.productUrl = this.quickAddBtn.dataset.productUrl;
        } else if (this.links.length) {
            this.productUrl = this.links[0].href;
        }

        this.addEventListener('change', this.handleSwatchChange.bind(this));
    }

    /**
     * Handles 'change' events in the product card swatches.
     * @param {object} evt - Event object.
     */
    handleSwatchChange(evt) {
        if (!evt.target.matches('.opt-btn')) return;

        // Swap current card image to selected variant image.
        if (evt.target.dataset.mediaId) {
            const variantMedia = this.querySelector(`[data-media-id="${evt.target.dataset.mediaId}"]`);

            if (variantMedia) {
                this.images.forEach((image) => {
                    image.hidden = true;
                });
                variantMedia.hidden = false;
            }
        }

        const separator = this.productUrl.split('?').length > 1 ? '&' : '?';
        const url = `${this.productUrl + separator}variant=${evt.target.dataset.variantId}`;

        // Update link hrefs to url of selected variant.
        this.links.forEach((link) => {
            link.href = url;
        });

        // Update the Quick Add button data.
        if (this.quickAddBtn) {
            this.quickAddBtn.dataset.selectedColor = evt.target.value;
        }
    }
}

customElements.define('product-card', ProductCard);
