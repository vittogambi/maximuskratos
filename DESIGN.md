---
name: Aethelgard High-Performance System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#ebbbb4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#b18780'
  outline-variant: '#603e39'
  surface-tint: '#ffb4a8'
  primary: '#ffb4a8'
  on-primary: '#690100'
  primary-container: '#ff5540'
  on-primary-container: '#5c0000'
  inverse-primary: '#c00100'
  secondary: '#ffb4a8'
  on-secondary: '#690000'
  secondary-container: '#920703'
  on-secondary-container: '#ff9a8a'
  tertiary: '#acc7ff'
  on-tertiary: '#002f67'
  tertiary-container: '#488fff'
  on-tertiary-container: '#00285b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930100'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#920703'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#acc7ff'
  on-tertiary-fixed: '#001a40'
  on-tertiary-fixed-variant: '#004491'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-xl:
    fontFamily: Bitte BC
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Bitte BC
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Bitte BC
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-sm:
    fontFamily: Bitte BC
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Bitte BC
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  score-display:
    fontFamily: Bitte BC
    fontSize: clamp(2.5rem, 6vw, 4.5rem)
    fontWeight: '900'
    lineHeight: 1
    letterSpacing: -0.01em
    fontVariantNumeric: tabular-nums
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The visual identity is rooted in the intersection of **Ancient Stoicism and Modern Precision**. It targets high-achieving men seeking discipline, self-mastery, and elite performance. The aesthetic direction merges the gravitas of classical antiquity with the clinical, high-tech efficiency of a premium developer tool.

The design style is a hybrid of **Minimalist Luxury and Glassmorphism**. We utilize deep, matte surfaces to create a sense of focused intensity, while vibrant crimson accents act as "blood-lines" that guide the eye to primary actions. The use of classical imagery (marble textures and Greco-Roman sculptures) is treated with modern cinematic lighting—strong highlights and deep shadows—to evoke a feeling of "monumental achievement."

**Key Visual Principles:**
- **Atmospheric Depth:** Use of subtle background blurs and tinted overlays to create a layered, multi-dimensional workspace.
- **Aggressive Focus:** Sharp, precise elements that convey discipline and high performance.
- **Cinematic Contrast:** High-contrast text and luminous accents against a void-like matte background.

## Colors

The palette is intentionally restricted to maintain a high-stakes, premium atmosphere. 

- **Primary Action Red (#ff0000):** Reserved for critical CTAs, progress indicators, and active states. It represents the "spark" of action.
- **Blood Red (#8b0000):** Used for hover states, depth gradients, and secondary accents to provide a sense of heritage and weight.
- **Matte Black & Deep Charcoal:** The foundation of the UI. Backgrounds are pure matte black (#0a0a0a) to ensure the hardware-inspired elements pop. Surface levels use #1a1a1a to define containers and interactive cards.
- **Marble White (#f5f5f5):** The primary typography color, chosen for its high legibility and "chiseled" feel compared to pure digital white.

## Typography

This design system employs a high-contrast typographic pairing aligned with the BrandCrowd logo.

**Bitte BC** (BrandCrowd) is used for display type and the MAXIMUS KRATOS wordmark. Condensed, bold, industrial — matches the logo’s distinctive letterforms (including the K).

**Bauhaus BC** (BrandCrowd) is reserved for the brand tagline «Alíneate» and similar micro-brand lines.

**Hanken Grotesk** serves as the functional workhorse for body text, UI, data, and navigation. Its neo-grotesque clarity balances the geometric display face.

**Web note:** BrandCrowd does not distribute BC font files with logo downloads. The site self-hosts OFL substitutes mapped to the same CSS names: Barlow Condensed ExtraBold → `Bitte BC`, Sulphur Point Light → `Bauhaus BC` (see `apps/web/public/fonts/OFL-NOTICE.txt`).

**Usage Rules:**
- All labels should utilize uppercase styling with increased letter-spacing to reinforce the "engineered" aesthetic.
- Narrative body text should use `body-lg` to ensure a premium, spacious reading experience.
- Host Bitte BC and Bauhaus BC webfonts in `apps/web/public/fonts/` (see `brand-fonts.css`).

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Dashboards and data-heavy views utilize a 12-column fluid grid to maximize screen real estate, while editorial or "learning" pages are constrained to a fixed 800px center column to maintain readability.

**Spacing Philosophy:**
- We use a 4px base unit. 
- **Density:** High density in utility areas (sidebars, toolbars) and generous, luxurious whitespace in content areas (articles, profile overviews).
- **Gaps:** Use a standard 24px gutter between major components to allow the dark surfaces to "breathe" without merging.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Elevation** and **Glassmorphism**, rather than traditional heavy shadows.

- **Level 0 (Background):** Matte Black (#0a0a0a). No elevation.
- **Level 1 (Cards/Containers):** Deep Charcoal (#1a1a1a) with a subtle 1px border of #2d2d2d. This creates a "milled" look.
- **Level 2 (Modals/Popovers):** Semi-transparent charcoal (80% opacity) with a background blur of 20px. This creates a premium glass effect that feels like dark obsidian.
- **Highlights:** Use a top-down "inner glow" (0.5px white border at 10% opacity) on primary containers to simulate light hitting the edge of a marble slab.

## Shapes

The design system uses **Sharp (0px)** roundedness. 

The choice of 90-degree angles is a deliberate nod to architectural precision and classical stone cutting. It conveys strength, stability, and a no-nonsense approach to personal development. 

*Exception:* Only circular avatars and specific "status pips" (like notification dots) may deviate from the sharp-edged rule. Everything else—buttons, inputs, cards—must remain strictly rectangular.

## Components

### Buttons
- **Primary:** Action Red (#ff0000) background, white text. Sharp corners. No gradient, but a subtle inner glow on top.
- **Secondary:** Transparent background, #f5f5f5 border (1px), white text.
- **Ghost:** No border, #a1a1a1 text, turns white on hover with a red underline.

### Input Fields
- **Style:** Underline only or 1px border on all sides using #2d2d2d. 
- **Focus State:** Border changes to #ff0000 with a subtle red outer glow. 
- **Text:** Input text is #f5f5f5; placeholders are #555555.

### Cards
- **Structure:** #1a1a1a background, 1px #2d2d2d border.
- **Header:** Cards should feature a `label-lg` category tag in Action Red at the top left.

### Progress Bars
- **Style:** Thin (4px height) tracks. The background is #2d2d2d, and the fill is a linear gradient from #8b0000 to #ff0000.

### Navigation
- **Sidebar:** Vertical, high-density navigation. Active links are indicated by a 2px vertical red line on the far left of the item.