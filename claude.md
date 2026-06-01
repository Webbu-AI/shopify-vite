# Skeleton Theme - Development Guidelines

## Core Architecture

### Build System & Development
- **Bundler**: Vite with Rollup optimization
- **CSS**: PostCSS + Tailwind CSS + Autoprefixer (Tailwind only!)
- **JavaScript**: Web Components with `@ungap/custom-elements` polyfill
- **Build**: `npm run build` for production assets
- **Vite build system**: JavaScript in `/src/` gets bundled into `/assets/main.bundle.js`
- **Never run npm commands**: User is always running `npm run dev` - don't run `npm run build` or `npm run dev`
- **JavaScript**: Add scripts to `/src/scripts/` (components or utils), never directly in liquid files
- **CSS**: Use Tailwind utility classes, avoid custom CSS
- **Live preview**: `shopify theme dev` for testing changes

### Key Packages
- **Swiper**: Carousel/slider functionality
- **PhotoSwipe**: Image lightbox and galleries

## Development Standards

### 1. Use Tailwind CSS Only
- **Mandatory**: Use Tailwind classes for all styling
- **CSS Variables**: Leverage existing theme variables (`var(--page-width)`, `var(--bg-color)`, etc.)
- **Custom Properties**: Extend Tailwind config for theme-specific values
- **Avoid**: Writing custom CSS unless for complex animations or vendor prefixes

```javascript
// Tailwind config extension example
theme: {
  extend: {
    spacing: {
      "page-width": "var(--page-width)"
    },
    colors: {
      bg: "var(--bg-color)",
      border: "var(--border-color)",
      primary: "var(--primary-color)"
    }
  }
}
```

### 2. Always Use Existing Snippets

#### Image Rendering - `image.liquid`
**Always use for single images with proper wrapper classes**
```liquid
<div class="media pb-[100%]">
  {% render 'image',
    image: section.settings.hero_image,
    widths: '480, 640, 960, 1280',
    src_width: 1280,
    sizes: '(min-width: 768px) 50vw, 100vw',
    class: 'img-fit',
    lazy_load: true
  %}
</div>
```

#### Essential Image CSS Classes

- **`.media`** - Container for images with `overflow: hidden` and `position: relative`
- **For fixed aspect ratios always use .media and padding bottom witha percentage (being percentage of width)**
- **`.img-fit`** - **Only use with `.media` containers when you want the image to fill a specific aspect ratio box**
  - Makes image `position: absolute` and fill container with `object-fit: cover`
  - Use `.img-fit--contain` for `object-fit: contain` behavior
  - **Not needed for regular responsive images** - only for controlled aspect ratio layouts

**Usage Examples:**
```liquid
<!-- Fixed aspect ratio with .img-fit -->
<div class="media pb-[100%]">
  {% render 'image', image: product.featured_image, class: 'img-fit', src_width: 800 %}
</div>

<!-- Regular responsive image (no .img-fit needed) -->
{% render 'image', image: product.featured_image, src_width: 800, class: 'w-full h-auto' %}
```

#### Responsive Images - `pictures.liquid`
**Use for art-directed responsive images with proper wrapper**
```liquid
<div class="media pb-[75%]">
  {% render 'pictures',
    breakpoints: '400, 800, 1200, 3000',
    image_400: mobile_image,
    image_800: tablet_image,
    image_1200: desktop_image,
    image_3000: large_image,
    widths: '400, 600, 800, 1200, 2000, 3000',
    sizes: '(min-width: 1200px) 50vw, 100vw',
    class: 'img-fit'
  %}
</div>
```

#### Other Essential Snippets
- `icon.liquid` - For all SVG icons
- `price.liquid` - For product pricing display
- `product-card.liquid` - For product grid items
- `pagination.liquid` - For collection/blog pagination
- `responsive-video.liquid` - For iframe video embeds

### 3. Web Components Pattern

#### Creating New Components
**Always extend HTMLElement and follow this pattern:**

```javascript
class ComponentName extends HTMLElement {
  constructor() {
    super();
    // Use lazy initialization for performance
    initLazyScript(this, this.init.bind(this));
  }

  init() {
    // Component initialization logic
    this.setupEventListeners();
    this.initializeFeatures();
  }

  connectedCallback() {
    // DOM connection logic (minimal)
  }

  disconnectedCallback() {
    // Cleanup logic
    this.removeEventListeners();
  }

  // Component methods...
}

customElements.define('component-name', ComponentName);
```

#### Component Registration
**Add to `/src/scripts/components/index.js`:**
```javascript
import './your-component.js';
```

### 4. Text Localization Requirements

**CRITICAL: Never hardcode text in templates or components**

#### Localization Rules
1. **All user-facing text** must be either:
   - Added to locale files (`/locales/en.default.json`)
   - Made configurable via section/block settings

2. **Use translation filters** for all text output:
```liquid
<!-- CORRECT: Using translations -->
<h2>{{ 'general.search.search' | t }}</h2>
<p>{{ 'templates.search.no_results' | t: terms: search.terms }}</p>

<!-- WRONG: Hardcoded text -->
<h2>Search</h2>
<p>No results found for {{ search.terms }}</p>
```

3. **Add to section settings** for customizable content:
```json
{
  "type": "text",
  "id": "heading",
  "label": "Heading",
  "default": "Featured Products"
}
```

```liquid
<!-- Use in template -->
<h2>{{ section.settings.heading }}</h2>
```

#### Translation Examples
```liquid
<!-- Basic usage -->
{{ 'general.accessibility.close' | t }}

<!-- With variables -->
{{ 'templates.search.results_with_count' | t: terms: search.terms, count: search.results_count }}

<!-- With fallback -->
{{ 'custom.section.heading' | t | default: 'Default Heading' }}
```

#### Handling Translation Key Errors

**CRITICAL: When theme-check reports missing translation keys, ALWAYS:**

1. **First, search existing locale files** for appropriate keys:
   ```bash
   # Search for existing keys
   grep -r "show_more" locales/
   grep -r "collapsible" locales/
   ```

2. **Use existing keys when available:**
   ```liquid
   <!-- CORRECT: Use existing key -->
   {{ 'accessibility.collapsible_content_title' | t }}

   <!-- WRONG: Create new key when existing one works -->
   {{ 'custom.show_more' | t }}
   ```

3. **Only add new translation keys** when no suitable existing key exists:
   ```json
   // Add to locales/en.default.json
   {
     "accessibility": {
       "collapsible_content_title": "Collapsible content",
       "your_new_key": "Your Text Here"
     }
   }
   ```

4. **Always update the locale file** when adding any text keys:
   - `locales/en.default.json` (English)

**Common existing translation keys:**
- `accessibility.close` - "Close"
- `accessibility.collapsible_content_title` - "Collapsible content"
- `general.search.search` - "Search"
- `products.facets.show_more` - "Show more"
- `products.facets.show_less` - "Show less"
- `general.accessibility.loading` - "Loading..."

### 5. Liquid Documentation Standard

**Always add comprehensive documentation to new snippets:**
The `doc` tag can only be used within a snippet or block. Not to sections


```liquid
{% doc %}
  Brief description of what the snippet does.

  @param {type} param_name - Description of parameter
  @param {type} [optional_param] - Description of optional parameter

  @example
  {% render 'snippet-name',
    param1: value1,
    param2: value2
  %}
{% enddoc %}
```

## Performance & Optimization

### Key Rules
- **Lazy load images** except above-the-fold
- **Use `initLazyScript()`** for component initialization
- **Intersection Observer** for scroll-triggered features
- **Tailwind JIT mode** for optimal CSS bundles

## Accessibility Standards

### Requirements
- **Semantic HTML** with proper heading hierarchy
- **ARIA attributes** for labels, descriptions, states
- **Keyboard navigation** for all interactive elements
- **Screen reader support** with descriptive text

## Code Standards

### Naming Conventions
- **Web Components**: kebab-case (`product-card`, `mega-menu`)
- **JavaScript Classes**: PascalCase (`ProductCard`, `MegaMenu`)
- **Liquid Snippets**: kebab-case with descriptive names

### Error Handling
```javascript
// Always wrap async operations
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    this.showError('Unable to load content. Please try again.');
    return null;
  }
}
```

## Quick Reference

**Note: User handles all dev server commands (`npm run dev`, `shopify theme dev`). Never suggest running these commands.**

### Common Patterns
```liquid
<!-- Standard image with proper wrapper -->
<div class="media aspect-square">
  {% render 'image', image: image, src_width: 800, class: 'img-fit' %}
</div>

<!-- Responsive image with wrapper, using padding-bottom for aspect ratio -->
<div class="media pb-[100%]">
  {% render 'pictures', image: image, breakpoints: '400,800,1200', widths: '400,800,1200,1600', class: 'img-fit' %}
</div>

<!-- Icon -->
{% render 'icon', icon: 'chevron-down', class: 'w-4 h-4' %}

<!-- Localized text -->
<h2>{{ 'general.search.search' | t }}</h2>
<p>{{ 'templates.search.results_with_count' | t: count: search.results_count, terms: search.terms }}</p>

<!-- Section setting text -->
<h3>{{ section.settings.heading }}</h3>
```

## CRITICAL DEVELOPMENT RULES

### 1. **CSS Class Pattern: Use Variables Directly**
```liquid
<!-- GOOD: Use setting values directly as classes -->
<div class="{{ image_position }} {{ mobile_image_position }}">

<!-- BAD: Complex conditional logic -->
<div class="{% if image_position == 'lg:order-1' %}lg:order-2{% endif %} {% if mobile_image_position == 'order-2' %}order-1{% endif %}">
```
The second one (BAD EXAMPLE) is also wrong because it assigned order-1 to be order-2 in practice, this is very counterintuitive.

**Why**: Setting values ARE the CSS classes. Don't overcomplicate with conditionals.

### 2. **Always Apply Both Desktop & Mobile Classes**
```liquid
<!-- GOOD: Both breakpoints covered -->
<div class="{{ desktop_setting }} {{ mobile_setting }}">

<!-- BAD: Only applies desktop class conditionally -->
<div class="{% if desktop_setting == 'lg:order-1' %}lg:order-1{% endif %}">
```

**Schema Pattern**:
```json
{
  "id": "desktop_position",
  "options": [
    { "value": "lg:order-1", "label": "Left" },
    { "value": "lg:order-2", "label": "Right" }
  ],
  "default": "lg:order-1"
},
{
  "id": "mobile_position",
  "options": [
    { "value": "order-1", "label": "First" },
    { "value": "order-2", "label": "Second" }
  ],
  "default": "order-1"
}
```

### 3. **Class-Based Option Values**
When select options map to CSS classes, use the actual class names:
```json
// GOOD
{ "value": "text-lg", "label": "Large" }
{ "value": "btn--solid", "label": "Solid" }
{ "value": "lg:order-1", "label": "Left" }

// BAD
{ "value": "large", "label": "Large" } // Then need switch statements
```

### 4. **Dynamic Setting Names with Loops**
```liquid
<!-- GOOD: Loop with dynamic names -->
{%- for i in (1..4) -%}
  {% liquid
    assign feature_setting = 'feature_' | append: i
    assign icon_setting = 'icon_' | append: i
  %}
  {%- if block.settings[feature_setting] != blank -%}
    <!-- Use the settings -->
  {%- endif -%}
{%- endfor -%}

<!-- BAD: Repetitive code -->
{%- if block.settings.feature_1 != blank -%}
{%- if block.settings.feature_2 != blank -%}
{%- if block.settings.feature_3 != blank -%}
```

### 5. **CSS Custom Properties Pattern**
```liquid
<!-- GOOD: CSS custom properties -->
<div style="--bg-color: {{ section.settings.background_color }};" class="bg-[var(--bg-color)]">

<!-- BAD: Inline styles -->
<div style="background-color: {{ section.settings.background_color }};">
```
This is especially good because it allows us to use different variables at different viewpoints. We could then use class="bg-[var(--bg-color--mobile)] md:bg-[var(--bg-color--desktop)]"

### 6. **Schema Text Input Types**
```json
// Single line with formatting
{ "type": "inline_richtext", "id": "heading" }

// Multi-line with HTML tags
{ "type": "richtext", "id": "description" }

// Plain text only
{ "type": "text", "id": "button_text" }

//Mulit-line plain text
{ "type": "textarea", "id": "button_text" }
```

### 7. **Liquid Tag for Multiple Variables**
```liquid
<!-- GOOD: Single liquid block -->
{% liquid
  assign icon_setting = 'icon_' | append: i
  assign title_setting = 'title_' | append: i
  assign text_setting = 'text_' | append: i
%}

<!-- BAD: Multiple separate tags -->
{%- assign icon_setting = 'icon_' | append: i -%}
{%- assign title_setting = 'title_' | append: i -%}
{%- assign text_setting = 'text_' | append: i -%}
```

### 8. **Assign Individual Variables for Long Class Attributes**
When class attributes become long with multiple settings, assign each setting to a shorter variable:
```liquid
<!-- GOOD: Individual variable assignments -->
{% liquid
  assign button_style = block.settings.button_style
  assign button_size = block.settings.button_size
  assign button_width_mobile = block.settings.button_width_mobile
  assign button_width_desktop = block.settings.button_width_desktop
%}
<a class="{{ button_style }} {{ button_size }} {{ button_width_mobile }} {{ button_width_desktop }}">

<!-- BAD: Long class attribute with full setting paths -->
<a class="{{ block.settings.button_style }} {{ block.settings.button_size }} {{ block.settings.button_width_mobile }} {{ block.settings.button_width_desktop }}">

<!-- BAD: One long concatenated variable -->
{% assign button_classes = block.settings.button_style | append: ' ' | append: block.settings.button_size %}
```

**Why**: Avoids long lines, keeps variables readable, and makes the HTML structure cleaner.

### 9. **Always Assign Section Variables at the Top**
Use a single liquid block at the top of every section to assign ALL settings to shorter variables:
```liquid
<!-- GOOD: All variables assigned at top -->
{% liquid
  assign layout = section.settings.layout
  assign heading = section.settings.heading
  assign heading_tag = section.settings.heading_tag
  assign heading_size = section.settings.heading_size
  assign image = section.settings.image
  assign bg_color = section.settings.background_color
  assign text_color = section.settings.text_color
  assign image_pos_mobile = section.settings.image_position_mobile
  assign image_pos_desktop = section.settings.image_position_desktop
%}

<section style="--bg: {{ bg_color }}; --text: {{ text_color }};">
  <{{ heading_tag }} class="{{ heading_size }}">{{ heading }}</{{ heading_tag }}>
</section>

<!-- BAD: Using full paths throughout -->
<section style="--bg: {{ section.settings.background_color }};">
  <{{ section.settings.heading_tag }} class="{{ section.settings.heading_size }}">
    {{ section.settings.heading }}
  </{{ section.settings.heading_tag }}>
</section>
```

**Why**: Makes code dramatically more readable, easier to maintain, and follows DRY principles.

### 10. **Use Tailwind Classes for CSS Variables**
Always use Tailwind utility classes with CSS variables instead of inline styles:
```liquid
<!-- GOOD: Tailwind classes -->
<h2 class="text-[var(--text)]">{{ heading }}</h2>
<div class="bg-[var(--bg)] text-[var(--text)]">Content</div>

<!-- BAD: Inline styles -->
<h2 style="color: var(--text);">{{ heading }}</h2>
<div style="background-color: var(--bg); color: var(--text);">Content</div>
```

**Why**: Consistent with Tailwind-first approach, better for responsive design, cleaner code.

### 11. **Auto-Calculate Opposite Positions**
Don't create redundant settings - calculate opposite values automatically:
```liquid
<!-- GOOD: Auto-calculate content position from image position -->
{% liquid
  assign image_pos_mobile = section.settings.image_position_mobile
  assign image_pos_desktop = section.settings.image_position_desktop

  if image_pos_mobile == 'order-1'
    assign content_pos_mobile = 'order-2'
  else
    assign content_pos_mobile = 'order-1'
  endif

  if image_pos_desktop == 'lg:order-1'
    assign content_pos_desktop = 'lg:order-2'
  else
    assign content_pos_desktop = 'lg:order-1'
  endif
%}

<!-- BAD: Separate settings for both -->
<div class="{{ section.settings.content_position_mobile }} {{ section.settings.content_position_desktop }}">
<div class="{{ section.settings.image_position_mobile }} {{ section.settings.image_position_desktop }}">
```

**Why**: Reduces settings clutter, impossible to create invalid combinations, simpler UX.

### 12. **Organize Settings with Headers**
Group related settings under descriptive headers for better UX:
```json
{
  "settings": [
    {
      "type": "header",
      "content": "Layout"
    },
    {
      "type": "select",
      "id": "layout",
      "label": "Layout"
    },
    {
      "type": "header",
      "content": "Heading"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading"
    },
    {
      "type": "header",
      "content": "Image"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "header",
      "content": "Colors"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color"
    },
    {
      "type": "header",
      "content": "Spacing"
    }
  ]
}
```

**Standard headers**: Layout, Heading, Image, Colors, Spacing, Typography, Content, Advanced

### 13. **Use Toggles with visible_if for Optional Settings**
Hide advanced/custom settings behind a checkbox toggle:
```json
{
  "type": "checkbox",
  "id": "use_custom_padding",
  "label": "Use custom padding",
  "default": false
},
{
  "type": "range",
  "id": "padding_top_mobile",
  "label": "Padding Top (Mobile)",
  "visible_if": "{{ section.settings.use_custom_padding == true }}"
}
```

Then handle defaults in liquid:
```liquid
{% liquid
  if section.settings.use_custom_padding
    assign pt_mobile = section.settings.padding_top_mobile
    assign pt_desktop = section.settings.padding_top_desktop
  else
    assign pt_mobile = 40
    assign pt_desktop = 60
  endif
%}
```

**Why**: Cleaner UI, provides sensible defaults, advanced users can still customize.

### 14. **Unify HTML Structure When Possible**
Don't duplicate entire HTML blocks for layout variations - share as much structure as possible:
```liquid
<!-- GOOD: Unified structure -->
{% if layout == 'fullwidth' %}
  <div class="grid lg:grid-cols-2 items-center min-h-[500px]">
{% else %}
  <div class="page-width">
    {% if heading != blank %}
      <div class="text-center mb-12"><{{ heading_tag }}>{{ heading }}</{{ heading_tag }}></div>
    {% endif %}
    <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
{% endif %}

  <!-- Shared content for both layouts -->
  <div class="{{ content_pos_mobile }} {{ content_pos_desktop }}">
    {%- for block in section.blocks -%}
      <!-- Block rendering -->
    {%- endfor -%}
  </div>

{% if layout == 'fullwidth' %}
  </div>
{% else %}
    </div>
  </div>
{% endif %}

<!-- BAD: Completely duplicated HTML for each layout -->
{% if layout == 'fullwidth' %}
  <div class="grid lg:grid-cols-2">
    <div>
      {%- for block in section.blocks -%}
        <!-- Duplicated block rendering -->
      {%- endfor -%}
    </div>
  </div>
{% else %}
  <div class="page-width">
    <div class="grid lg:grid-cols-2">
      <div>
        {%- for block in section.blocks -%}
          <!-- Duplicated block rendering -->
        {%- endfor -%}
      </div>
    </div>
  </div>
{% endif %}
```

**Why**: Eliminates duplication, easier to maintain, changes in one place affect both layouts.

## Button System Architecture

### CSS Custom Properties Approach
The theme uses a smart CSS custom properties system for flexible button theming:

```css
.btn {
    /* Button custom properties with defaults */
    --button-bg: var(--color-primary-button-bg);
    --button-text: var(--color-primary-button-text);
    --button-border: var(--color-primary-button-border);
    --button-hover-bg: var(--color-primary-button-hover);
    --button-hover-border: var(--color-primary-button-hover-border);
    --button-border-width: var(--primary-button-border-width);

    /* Apply custom properties */
    background-color: var(--button-bg);
    color: var(--button-text);
    border: var(--button-border-width) solid var(--button-border);
}

.btn--secondary {
    --button-bg: var(--color-secondary-button-bg);
    --button-text: var(--color-secondary-button-text);
    --button-border: var(--color-secondary-button-border);
    --button-hover-bg: var(--color-secondary-button-hover);
    --button-hover-border: var(--color-secondary-button-hover-border);
    --button-border-width: var(--secondary-button-border-width);
}
```

### Custom Button Implementation
For custom buttons, override CSS custom properties directly in style attribute:
```liquid
{%- if block.settings.button_style == 'btn--custom' -%}
  <a
    class="btn"
    style="--button-bg: {{ block.settings.custom_bg_color }}; --button-text: {{ block.settings.custom_text_color }}; --button-border: {{ block.settings.custom_border_color }}; --button-hover-bg: {{ block.settings.custom_hover_color }}; --button-hover-border: {{ block.settings.custom_hover_border_color }}; --button-border-width: {{ block.settings.custom_border_width }}px"
  >
    {{ block.settings.button_text }}
  </a>
{%- else -%}
  <a class="btn {{ block.settings.button_style }}">
    {{ block.settings.button_text }}
  </a>
{%- endif -%}
```

### Button Settings Schema Pattern
Standard button settings for sections/blocks:
```json
{
  "type": "select",
  "id": "button_style",
  "label": "Button Style",
  "options": [
    { "value": "btn--primary", "label": "Primary" },
    { "value": "btn--secondary", "label": "Secondary" },
    { "value": "btn--custom", "label": "Custom" }
  ],
  "default": "btn--primary"
},
{
  "type": "color",
  "id": "custom_bg_color",
  "label": "Custom Background",
  "visible_if": "{{ block.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_text_color",
  "label": "Custom Text Color",
  "visible_if": "{{ block.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_border_color",
  "label": "Custom Border Color",
  "visible_if": "{{ block.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_hover_color",
  "label": "Custom Hover Background",
  "visible_if": "{{ block.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_hover_border_color",
  "label": "Custom Hover Border",
  "visible_if": "{{ block.settings.button_style == 'btn--custom' }}"
},
{
  "type": "range",
  "id": "custom_border_width",
  "label": "Custom Border Width",
  "min": 0,
  "max": 5,
  "step": 1,
  "unit": "px",
  "default": 1,
  "visible_if": "{{ block.settings.button_style == 'btn--custom' }}"
}
```

### Button System Benefits
- **3-Level Control**: Global theme colors, section-level choice, per-button custom colors
- **Smart CSS**: No class bloat, uses custom properties for efficient theming
- **Maintainable**: Changes to button structure only require CSS updates
- **Flexible**: Supports primary, secondary, and unlimited custom button styles
- **Separate Border Widths**: Primary buttons, secondary buttons, and custom buttons each have independent border width controls

## Standard Section Settings

### Standard Heading Settings
**ALWAYS include these settings when a section has a heading:**

```json
{
  "type": "header",
  "content": "Heading"
},
{
  "type": "text",
  "id": "title",
  "label": "Title",
  "default": "Section Title"
},
{
  "type": "select",
  "id": "heading_tag",
  "label": "Heading Tag",
  "options": [
    { "value": "h1", "label": "H1" },
    { "value": "h2", "label": "H2" },
    { "value": "h3", "label": "H3" },
    { "value": "h4", "label": "H4" },
    { "value": "h5", "label": "H5" },
    { "value": "h6", "label": "H6" },
    { "value": "div", "label": "Div" }
  ],
  "default": "h2"
},
{
  "type": "select",
  "id": "heading_size_mobile",
  "label": "Heading Size (Mobile)",
  "options": [
    { "value": "text-xs", "label": "Extra Small" },
    { "value": "text-sm", "label": "Small" },
    { "value": "text-base", "label": "Base" },
    { "value": "text-lg", "label": "Large" },
    { "value": "text-xl", "label": "Extra Large" },
    { "value": "text-2xl", "label": "2X Large" },
    { "value": "text-3xl", "label": "3X Large" },
    { "value": "text-4xl", "label": "4X Large" },
    { "value": "text-5xl", "label": "5X Large" },
    { "value": "text-6xl", "label": "6X Large" }
  ],
  "default": "text-2xl"
},
{
  "type": "select",
  "id": "heading_size_desktop",
  "label": "Heading Size (Desktop)",
  "options": [
    { "value": "md:text-xs", "label": "Extra Small" },
    { "value": "md:text-sm", "label": "Small" },
    { "value": "md:text-base", "label": "Base" },
    { "value": "md:text-lg", "label": "Large" },
    { "value": "md:text-xl", "label": "Extra Large" },
    { "value": "md:text-2xl", "label": "2X Large" },
    { "value": "md:text-3xl", "label": "3X Large" },
    { "value": "md:text-4xl", "label": "4X Large" },
    { "value": "md:text-5xl", "label": "5X Large" },
    { "value": "md:text-6xl", "label": "6X Large" }
  ],
  "default": "md:text-3xl"
},
{
  "type": "select",
  "id": "heading_weight",
  "label": "Heading Weight",
  "options": [
    { "value": "font-light", "label": "Light" },
    { "value": "font-normal", "label": "Normal" },
    { "value": "font-medium", "label": "Medium" },
    { "value": "font-bold", "label": "Bold" }
  ],
  "default": "font-normal"
},
{
  "type": "select",
  "id": "heading_align_mobile",
  "label": "Heading Alignment (Mobile)",
  "options": [
    { "value": "text-left", "label": "Left" },
    { "value": "text-center", "label": "Center" },
    { "value": "text-right", "label": "Right" }
  ],
  "default": "text-left"
},
{
  "type": "select",
  "id": "heading_align_desktop",
  "label": "Heading Alignment (Desktop)",
  "options": [
    { "value": "md:text-left", "label": "Left" },
    { "value": "md:text-center", "label": "Center" },
    { "value": "md:text-right", "label": "Right" }
  ],
  "default": "md:text-left"
}
```

**Liquid implementation:**
```liquid
{%- if section.settings.title != blank -%}
  {% liquid
    assign heading_tag = section.settings.heading_tag
    assign heading_size_mobile = section.settings.heading_size_mobile
    assign heading_size_desktop = section.settings.heading_size_desktop
    assign heading_weight = section.settings.heading_weight
    assign heading_align_mobile = section.settings.heading_align_mobile
    assign heading_align_desktop = section.settings.heading_align_desktop
  %}
  <{{ heading_tag }} class="{{ heading_size_mobile }} {{ heading_size_desktop }} {{ heading_weight }} {{ heading_align_mobile }} {{ heading_align_desktop }}">
    {{ section.settings.title }}
  </{{ heading_tag }}>
{%- endif -%}
```

### Standard Button Settings
**ALWAYS include these settings when a section has a button:**

```json
{
  "type": "header",
  "content": "Button"
},
{
  "type": "checkbox",
  "id": "show_button_mobile",
  "label": "Show button (Mobile)",
  "default": false
},
{
  "type": "checkbox",
  "id": "show_button_desktop",
  "label": "Show button (Desktop)",
  "default": true
},
{
  "type": "text",
  "id": "button_label",
  "label": "Button label",
  "default": "Click here",
  "visible_if": "{{ section.settings.show_button_mobile == true or section.settings.show_button_desktop == true }}"
},
{
  "type": "url",
  "id": "button_link",
  "label": "Button link",
  "visible_if": "{{ section.settings.show_button_mobile == true or section.settings.show_button_desktop == true }}"
},
{
  "type": "select",
  "id": "button_style",
  "label": "Button Style",
  "options": [
    { "value": "btn--primary", "label": "Primary" },
    { "value": "btn--secondary", "label": "Secondary" },
    { "value": "btn--custom", "label": "Custom" }
  ],
  "default": "btn--primary",
  "visible_if": "{{ section.settings.show_button_mobile == true or section.settings.show_button_desktop == true }}"
},
{
  "type": "color",
  "id": "custom_bg_color",
  "label": "Custom Background",
  "visible_if": "{{ section.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_text_color",
  "label": "Custom Text Color",
  "visible_if": "{{ section.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_border_color",
  "label": "Custom Border Color",
  "visible_if": "{{ section.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_hover_color",
  "label": "Custom Hover Background",
  "visible_if": "{{ section.settings.button_style == 'btn--custom' }}"
},
{
  "type": "color",
  "id": "custom_hover_border_color",
  "label": "Custom Hover Border",
  "visible_if": "{{ section.settings.button_style == 'btn--custom' }}"
},
{
  "type": "range",
  "id": "custom_border_width",
  "label": "Custom Border Width",
  "min": 0,
  "max": 5,
  "step": 1,
  "unit": "px",
  "default": 1,
  "visible_if": "{{ section.settings.button_style == 'btn--custom' }}"
}
```

**Liquid implementation:**
```liquid
{%- if section.settings.show_button_mobile or section.settings.show_button_desktop -%}
  {% liquid
    assign button_class = ''
    if section.settings.show_button_mobile and section.settings.show_button_desktop
      assign button_class = 'btn'
    elsif section.settings.show_button_mobile
      assign button_class = 'btn md:hidden'
    elsif section.settings.show_button_desktop
      assign button_class = 'btn hidden md:inline-flex'
    endif
  %}
  {%- if section.settings.button_style == 'btn--custom' -%}
    <a
      class="{{ button_class }}"
      style="--button-bg: {{ section.settings.custom_bg_color }}; --button-text: {{ section.settings.custom_text_color }}; --button-border: {{ section.settings.custom_border_color }}; --button-hover-bg: {{ section.settings.custom_hover_color }}; --button-hover-border: {{ section.settings.custom_hover_border_color }}; --button-border-width: {{ section.settings.custom_border_width }}px"
      href="{{ section.settings.button_link }}"
    >
      {{ section.settings.button_label }}
    </a>
  {%- else -%}
    <a class="{{ button_class }} {{ section.settings.button_style }}" href="{{ section.settings.button_link }}">
      {{ section.settings.button_label }}
    </a>
  {%- endif -%}
{%- endif -%}
```

**Note:** For blocks, replace `section.settings` with `block.settings` in both schema and liquid.

## Architecture Overview

### Directory Structure
- `/src/` - Source JavaScript/TypeScript (gets bundled)
  - `/src/scripts/components/` - Web components
  - `/src/scripts/utils/` - Utility functions
  - `/src/entrypoints/theme.js` - Main entry point
- `/sections/` - Dynamic sections - main building blocks
- `/snippets/` - Reusable components
- `/templates/` - JSON page templates (Online Store 2.0)
- `/assets/` - Compiled bundles, fonts, images
- `/layout/theme.liquid` - Main layout wrapper

### Key Patterns
1. **Online Store 2.0**: JSON templates with dynamic sections
2. **Component Architecture**: Heavy use of snippets for DRY code
3. **Responsive Design**: Mobile-first development
4. **Settings-Driven**: Content configurable via section settings

### Key Snippets
- `image.liquid` - Responsive images with lazy loading
- `icon.liquid` - Icon rendering system
- `pictures.liquid` - Complex responsive images

## Development Guidelines

### Content & Assets
- **No Media Assets**: Never add images/videos in code - leave image_picker fields empty
- **Image Placeholders**: Use `{{ 'image' | placeholder_svg_tag: 'classes' }}` for landing pages

### Styling & Layout
- **Tailwind CSS**: Use utility classes for all styling
- **Mobile-First**: Design mobile-first, enhance for desktop
- **Container Settings**: Add configurable container sizes and spacing
- **Color Schemes**: Use theme color schemes with CSS custom properties

### JavaScript Integration
- **Components**: Web components in `/src/scripts/components/`
- **Utils**: Utility functions in `/src/scripts/utils/`
- **Import**: Add to `/src/entrypoints/theme.js` or component index
- **Events**: Use event delegation for performance

### Schema Best Practices
- **Conditional Fields**: Use `visible_if` for dependent settings
- **25 Character Limit**: Section schema names max 25 chars
- **Descriptive Labels**: Clear, actionable setting labels
- **Sensible Defaults**: Set appropriate default values
- **Disable on Aside**: All normal sections (not drawers/popups) must include `disabled_on: { groups: ["aside"] }`

#### Visible If Syntax
The `visible_if` property must be a string with Liquid template syntax:
```json
// CORRECT: String with Liquid syntax
{
  "type": "color",
  "id": "custom_bg_color",
  "label": "Custom Background",
  "visible_if": "{{ section.settings.button_style == 'btn--custom' }}"
}

// For block settings, use block.settings
{
  "type": "color",
  "id": "custom_bg_color",
  "label": "Custom Background",
  "visible_if": "{{ block.settings.button_style == 'btn--custom' }}"
}

// WRONG: Object notation
{
  "type": "color",
  "id": "custom_bg_color",
  "label": "Custom Background",
  "visible_if": {
    "button_style": "btn--custom"
  }
}

// Examples of valid visible_if conditions:
"visible_if": "{{ section.settings.show_border == true }}"
"visible_if": "{{ block.settings.type != 'text' }}"
"visible_if": "{{ section.settings.layout == 'grid' or section.settings.layout == 'list' }}"
```

#### Disabled On Syntax
All normal sections (not drawers, popups, or overlay sections) must include `disabled_on` to prevent them from being used in aside groups:

```json
// CORRECT: Normal section with disabled_on
{
  "name": "Hero Banner",
  "tag": "section",
  "class": "section",
  "settings": [
    // ... settings
  ],
  "presets": [
    {
      "name": "Hero Banner"
    }
  ],
  "disabled_on": {
    "groups": ["aside"]
  }
}

// WRONG: Normal section without disabled_on
{
  "name": "Hero Banner",
  "tag": "section",
  "class": "section",
  "settings": [
    // ... settings
  ],
  "presets": [
    {
      "name": "Hero Banner"
    }
  ]
  // Missing disabled_on
}

// CORRECT: Drawer/overlay section (no disabled_on needed)
{
  "name": "Cart Drawer",
  "tag": "section",
  "class": "drawer",
  "settings": [
    // ... settings
  ]
  // No disabled_on - this section IS for aside group
}
```

**Why**: The `disabled_on` property prevents normal content sections from being accidentally added to aside groups (drawers, popups), which are reserved for overlay UI components.

This document should be updated as the theme evolves and new patterns emerge.
