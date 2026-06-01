import Flickity from 'flickity';
import 'flickity-as-nav-for';
import 'flickity/css/flickity.css';
import { afterCallstack } from '~/scripts/utils/utils.js';

class ProductImages extends HTMLElement {
    constructor() {
        super();
        this.flickityOptions = {
            prevNextButtons: false,
            pageDots: false,
            wrapAround: true
        };

        this.isThumbnails = this.hasAttribute('data-thumbnails');
    }

    connectedCallback() {
        this.section = this.closest('.shopify-section');

        if (this.isThumbnails) {
            const mainSlider = this.section?.querySelector('[data-slider]');

            this.flickityOptions.cellAlign = 'left';
            this.flickityOptions.contain = true;
            this.flickityOptions.wrapAround = false;
            this.flickityOptions.asNavFor = mainSlider;
        }

        document.addEventListener('on:variant:change', this.handleVariantChange.bind(this));

        this.init();
    }

    init() {
        this.initSlider();
    }

    getImagesToLoad() {
        const imageSwipeEls = Array.from(this.querySelectorAll('[data-image-id]'));

        return imageSwipeEls
            .map((el) => {
                const imageEl = el.querySelector('img');

                if (!this.variant) {
                    return imageEl;
                }

                const variantId = this.variant.id;

                if (el.dataset.variantId == variantId) {
                    return imageEl;
                }

                return null;
            })
            .filter(Boolean);
    }

    async waitUntilImagesLoaded(images) {
        const imageLoadPromises = images.map((img) => {
            return new Promise((resolve) => {
                if (!img) {
                    resolve('no img el');
                    return;
                }

                if (img.complete && img.src) {
                    resolve('img loaded (complete)');
                    return;
                }

                img.addEventListener('load', () => {
                    resolve('img loaded (event)');
                });
            });
        });

        const results = await Promise.all(imageLoadPromises);

        return;
    }

    initSlider() {
        const sliderElement = this.querySelector('[data-slider]');

        if (!sliderElement) {
            console.error('No slider element found with [data-slider]');
            return;
        }

        this.slider = new Flickity(sliderElement, this.flickityOptions);

        this.slides = [...this.slider.getCellElements()];

        afterCallstack(() => {
            const imagesToLoad = this.getImagesToLoad();

            this.waitUntilImagesLoaded(imagesToLoad).then(() => {
                this.updateImagesShown();
            });
        }, 100).then(() => {
            sliderElement.classList.add('custom-flickity-initialized');
        });
    }

    handleThumbnailClick(evt) {
        const imageId = evt.target.dataset.imageId;

        const index = this.slider.slides.findIndex((el) => el.dataset.imageId === imageId);

        this.slider.slideTo(index);
    }

    handleVariantChange(evt) {
        if (evt?.detail?.variant) {
            this.variant = evt.detail.variant;
        }

        if (this.variant && this.slider) {
            this.updateImagesShown();
        }
    }

    updateImagesShown() {
        if (!this.variant) {
            this.slides.forEach((slide) => {
                if (!this.slider.getCellElements().includes(slide)) {
                    this.slider.append(slide);
                }
            });
        } else {
            const variantId = this.variant.id;

            const variantSlide = this.slides.find((slide) => slide.dataset.variantId == variantId);

            //hide all non variant images
            this.slides.forEach((slide) => {
                let show = slide.dataset.variantId == variantId;

                //if no variant slide, show all images
                if (!variantSlide) {
                    show = true;
                }

                if (!show) {
                    // Clear inline styles completely before removing
                    slide.style = '';
                    this.slider.remove(slide);
                } else if (!this.slider.getCellElements().includes(slide)) {
                    this.slider.append(slide);
                }
            });
        }
        afterCallstack(() => {
            this.reloadSlider();
        });
    }

    reloadSlider() {
        this.slider.options.cellAlign = this.isThumbnails ? 'left' : 'center';
        this.slider.options.contain = true;

        this.slider.reloadCells();
        this.slider.resize();

        this.slider.select(0, false, true); // No animation, force selection

        if (this.isThumbnails) {
            this.slider.options.cellAlign = 'left';
            // Force position calculation again after selection
            this.slider.resize();
        }

        this.slider.updateDraggable();
    }
}

customElements.define('product-images', ProductImages);
