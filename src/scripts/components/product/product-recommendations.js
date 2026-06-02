import { initLazyImages } from '~/scripts/utils/helpers/lazy-media.js';
import { initLazyScript } from '~/scripts/utils/theme-functions.js';

class ProductRecommendations extends HTMLElement {
    constructor() {
        super();
        initLazyScript(this, this.init.bind(this), 500);
    }

    async init() {
        const productId = this.dataset.productId;
        if (!productId) return;

        try {
            const response = await fetch(`${this.dataset.url}&product_id=${productId}`);
            if (!response.ok) throw new Error(response.status);

            const tmpl = document.createElement('template');
            tmpl.innerHTML = await response.text();

            const el = tmpl.content.querySelector('product-recommendations');

            if (el && el.hasChildNodes()) {
                this.innerHTML = el.innerHTML;
            }

            initLazyImages();
        } catch (error) {
            console.error('Product recommendations failed to load', error);
        }
    }
}

customElements.define('product-recommendations', ProductRecommendations);
