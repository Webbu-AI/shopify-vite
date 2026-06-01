class ProductForm extends HTMLElement {
    constructor() {
        super();
        if (this.hasChildNodes()) this.init();
    }

    init() {
        this.form = this.querySelector('.js-product-form');
        if (this.form) {
            this.form.querySelector('[name="id"]').disabled = false;
            this.cartDrawer = document.querySelector('cart-drawer');
            this.submitBtn = this.querySelector('[name="add"]');

            this.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    /**
     * Handles submission of the product form.
     * @param {object} evt - Event object.
     */
    async handleSubmit(evt) {
        evt.preventDefault();

        if (this.submitBtn.getAttribute('aria-disabled') === 'true') return;

        this.errorMsg = null;
        this.setErrorMsgState();

        // Disable "Add to Cart" button until submission is complete.
        this.submitBtn.setAttribute('aria-disabled', 'true');
        this.submitBtn.classList.add('is-loading');

        const formData = new FormData(this.form);
        let sections = 'cart-icon-bubble';
        if (this.cartDrawer) {
            sections += `,${this.cartDrawer
                .closest('.shopify-section')
                .id.replace('shopify-section-', '')}`;
        }

        formData.append('sections_url', window.location.pathname);
        formData.append('sections', sections);

        if (window.customColor) {
            formData.append('properties[Color]', window.customColor);
        }

        const fetchRequestOpts = {
            method: 'POST',
            headers: {
                'Accept': 'application/javascript',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        };

        try {
            const response = await fetch(theme.routes.cartAdd, fetchRequestOpts);
            const data = await response.json();
            const error = typeof data.description === 'string' ? data.description : data.message;

            if (data.status) this.setErrorMsgState(error);

            if (!response.ok) throw new Error(response.status);

            this.dispatchEvent(
                new CustomEvent('on:cart:add', {
                    bubbles: true,
                    detail: {
                        variantId: data.variant_id,
                        sections: data.sections
                    }
                })
            );
        } catch (error) {
            console.log(error);
            this.dispatchEvent(
                new CustomEvent('on:cart:error', {
                    bubbles: true,
                    detail: {
                        error: this.errorMsg.textContent
                    }
                })
            );
        } finally {
            this.submitBtn.classList.remove('is-loading');
            this.submitBtn.removeAttribute('aria-disabled');
        }
    }

    /**
     * Shows/hides an error message.
     * @param {string} [error=false] - Error to show a message for.
     */
    setErrorMsgState(error = false) {
        this.errorMsg = this.errorMsg || this.querySelector('.js-form-error');
        if (!this.errorMsg) return;

        this.errorMsg.hidden = !error;
        if (error) this.errorMsg.textContent = error;
    }
}

customElements.define('product-form', ProductForm);
