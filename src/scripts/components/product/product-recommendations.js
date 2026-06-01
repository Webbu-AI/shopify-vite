import { initLazyImages } from '~/scripts/utils/lazy-images.js';
import { initLazyScript } from '../../utils/theme-functions';

class ProductRecommendations extends HTMLElement {
    constructor() {
        super();
        initLazyScript(this, this.init.bind(this), 500);
    }

    async init() {
        const productId = this.dataset.productId || window.meta.product.id;

        if (!productId) return;

        console.log('init', productId);

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
            console.log(error);
        }
    }
}

customElements.define('product-recommendations', ProductRecommendations);
