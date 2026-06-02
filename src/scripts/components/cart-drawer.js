import { openDrawer } from '~/scripts/utils/drawer-toggle.js';

/**
 * <cart-drawer> — refreshes its own HTML via Shopify Section Rendering API
 * when an item is added to the cart, then opens itself.
 */
class CartDrawer extends HTMLElement {
    constructor() {
        super();
        this.section = this.closest('.shopify-section');
        this.sectionId = this.section?.id.replace('shopify-section-', '');

        this.handleCartAdd = (event) => this.refresh(event.detail?.sections);
        this.handleClick = (event) => {
            const removeBtn = event.target.closest('.js-cart-remove');
            if (removeBtn) {
                event.preventDefault();
                this.changeLine(parseInt(removeBtn.dataset.index, 10), 0);
            }
        };
        this.handleChange = (event) => {
            const input = event.target.closest('input[name="updates[]"]');
            if (input) {
                this.changeLine(parseInt(input.dataset.index, 10), parseInt(input.value, 10));
            }
        };
    }

    connectedCallback() {
        document.addEventListener('on:cart:add', this.handleCartAdd);
        this.addEventListener('click', this.handleClick);
        this.addEventListener('change', this.handleChange);
    }

    disconnectedCallback() {
        document.removeEventListener('on:cart:add', this.handleCartAdd);
        this.removeEventListener('click', this.handleClick);
        this.removeEventListener('change', this.handleChange);
    }

    async refresh(sections) {
        if (sections && sections[this.sectionId]) {
            this.replaceWithFreshHTML(sections[this.sectionId]);
        } else {
            await this.refetch();
        }
        this.updateBubble();
        openDrawer(document.querySelector('cart-drawer'));
    }

    async refetch() {
        try {
            const res = await fetch(`${window.location.pathname}?sections=${this.sectionId}`);
            const data = await res.json();
            if (data[this.sectionId]) this.replaceWithFreshHTML(data[this.sectionId]);
        } catch (err) {
            console.error('Cart drawer refetch failed', err);
        }
    }

    replaceWithFreshHTML(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = doc.querySelector('cart-drawer');
        if (fresh) this.innerHTML = fresh.innerHTML;
    }

    async changeLine(line, quantity) {
        try {
            const res = await fetch(window.theme.routes.cartChange, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    line,
                    quantity,
                    sections: this.sectionId,
                    sections_url: window.location.pathname
                })
            });
            const data = await res.json();
            if (data.sections && data.sections[this.sectionId]) {
                this.replaceWithFreshHTML(data.sections[this.sectionId]);
            } else {
                await this.refetch();
            }
            this.updateBubble();
        } catch (err) {
            console.error('Cart line change failed', err);
        }
    }

    async updateBubble() {
        try {
            const res = await fetch(`${window.theme.routes.cart}.js`);
            const cart = await res.json();
            document.querySelectorAll('[data-cart-count]').forEach((el) => {
                el.textContent = cart.item_count;
                el.style.display = cart.item_count > 0 ? '' : 'none';
            });
            const titleCount = this.querySelector('[data-cart-count-title]');
            if (titleCount) titleCount.textContent = `(${cart.item_count})`;
        } catch (err) {
            console.error('Cart count update failed', err);
        }
    }
}

customElements.define('cart-drawer', CartDrawer);
