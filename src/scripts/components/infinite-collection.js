import { initLazyImages } from '../utils/helpers/lazy-media.js';
import { initLazyScript } from '../utils/theme-functions.js';

const CONSTANTS = {
    PRODUCT_CARD_SELECTOR: 'product-card',
    PAGINATION_SELECTOR: '.js-pagination',
    NEXT_PAGE_LINK_SELECTOR: '[data-next-page-link]',
    ROOT_MARGIN_MULTIPLIER: 1.5
};

class InfiniteCollection extends HTMLElement {
    constructor() {
        super();

        initLazyScript(this, this.init.bind(this));

        //listen to loading from cache event
        document.addEventListener('on:bfcache:load-restore', this.reload.bind(this));
    }

    disconnectedCallback() {
        this.destroy();
    }

    init() {
        this.pagination = this.querySelector(CONSTANTS.PAGINATION_SELECTOR);
        if (!this.pagination) return;
        this.nextPageLink = this.pagination.querySelector(CONSTANTS.NEXT_PAGE_LINK_SELECTOR);
        this.results = this.querySelectorAll(CONSTANTS.PRODUCT_CARD_SELECTOR);
        this.controller = null;

        // Bind click handlers to pagination results
        this.resultClickHandler = this.resultClickHandler || this.handleResultClick.bind(this);
        this.addEventListener('click', this.resultClickHandler);

        if (this.nextPageLink && this.results.length > 0) {
            this.initObserver();
        } else {
            console.error('No results found', this.nextPageLink, this.results);
        }
    }

    initObserver() {
        // Cleanup existing observer if any
        if (this.paginationObserver) {
            this.paginationObserver.disconnect();
        }

        this.paginationObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !this.isFetching) {
                        this.loadMore();
                    }
                });
            },
            { rootMargin: `${window.innerHeight * CONSTANTS.ROOT_MARGIN_MULTIPLIER}px 0px` }
        );

        this.paginationObserver.observe(this.pagination);
    }

    /**
     * Destroys the component
     */
    destroy() {
        if (this.paginationObserver) {
            this.paginationObserver.disconnect();
            this.paginationObserver = null;
        }
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
        this.removeEventListener('click', this.resultClickHandler);
    }

    /**
     * Reloads the component
     */
    reload() {
        this.destroy();
        this.init();
    }

    /**
     * Handles a click on a item in the pagination
     * @param {object} evt - Event object
     */
    handleResultClick(evt) {
        if (evt.target.closest('a') && evt.target.closest(CONSTANTS.PRODUCT_CARD_SELECTOR)) {
            if (this.controller) {
                this.controller.abort();
                this.controller = null;
            }
        }
    }

    /**
     * Fetches more results from the next page of results, and dynamically updates this page
     */
    async loadMore() {
        if (this.isFetching || this.dataset.pauseInfiniteScroll === 'true') {
            return;
        }

        this.isFetching = true;
        this.pagination?.classList.add('is-loading');
        this.controller = new AbortController();

        try {
            if (!this.nextPageLink) throw new Error("No 'Load more' button found.");

            const response = await fetch(this.nextPageLink.href, {
                signal: this.controller.signal
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            if (this.dataset.pauseInfiniteScroll === 'true') {
                throw new Error('Infinite scroll was interrupted.');
            }

            const html = await response.text();

            this.updateElements(html);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('InfiniteCollection: Unable to fetch next page', error);
            }
        } finally {
            this.pagination?.classList.remove('is-loading');
            this.controller = null;
            this.isFetching = false;
        }
    }

    updateElements(html) {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = html;

        // Validate last result exists and is connected
        const lastResult = this.results[this.results.length - 1];
        if (!lastResult || !lastResult.isConnected) {
            console.error('InfiniteCollection: Last result element not found or disconnected');
            return;
        }

        let newResultsHtml = '';
        tmpl.content.querySelectorAll(CONSTANTS.PRODUCT_CARD_SELECTOR).forEach((result) => {
            newResultsHtml += result.outerHTML;
        });
        lastResult.insertAdjacentHTML('afterend', newResultsHtml);

        initLazyImages();

        this.results = this.querySelectorAll(CONSTANTS.PRODUCT_CARD_SELECTOR);

        const newPagination = tmpl.content.querySelector(CONSTANTS.PAGINATION_SELECTOR);
        if (newPagination && this.pagination) {
            this.pagination.innerHTML = newPagination.innerHTML;
            this.nextPageLink = this.pagination.querySelector(CONSTANTS.NEXT_PAGE_LINK_SELECTOR);

            if (!this.nextPageLink) {
                this.pagination.remove();
                this.destroy();
            } else {
                // Recreate observer for updated pagination
                this.initObserver();
            }
        }
    }
}

customElements.define('infinite-collection', InfiniteCollection);
