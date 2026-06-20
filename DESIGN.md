---
name: Velvet & Gilt
colors:
  surface: '#16130b'
  surface-dim: '#16130b'
  surface-bright: '#3d392f'
  surface-container-lowest: '#110e07'
  surface-container-low: '#1f1b13'
  surface-container: '#231f17'
  surface-container-high: '#2d2a21'
  surface-container-highest: '#38342b'
  on-surface: '#eae1d4'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#eae1d4'
  inverse-on-surface: '#343027'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#e0c0b4'
  on-secondary: '#402c24'
  secondary-container: '#5b443b'
  on-secondary-container: '#d1b2a7'
  tertiary: '#bfcdff'
  on-tertiary: '#082b72'
  tertiary-container: '#97b0ff'
  on-tertiary-container: '#254188'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#fddbd0'
  secondary-fixed-dim: '#e0c0b4'
  on-secondary-fixed: '#291710'
  on-secondary-fixed-variant: '#584239'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#27438a'
  background: '#16130b'
  on-background: '#eae1d4'
  surface-variant: '#38342b'
  cacao-black: '#1A0F0A'
  chocolate-deep: '#241611'
  cream-silk: '#F5F5F0'
  gold-leaf: '#C5A028'
  warm-overlay: rgba(45, 27, 20, 0.6)
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

The brand personality is **Indulgent, Artisanal, and Exclusive**. It positions a milkshake not just as a beverage, but as a luxury experience. The design system targets a sophisticated audience that values quality over speed and ritual over convenience.

The visual style is a fusion of **Corporate Modern** structure with **Glassmorphism** and **Tactile** depth. It uses a "rich chocolate and gold" aesthetic that relies on dark, warm tones to create a sense of intimacy and premium quality. Every interaction should feel deliberate and smooth, evoking the texture of a thick, velvety cream. High-contrast serif typography provides a boutique editorial feel, while spacious layouts ensure the content never feels crowded, maintaining an air of exclusivity.

## Colors

The palette is centered around the "Luxe Brown" spectrum, using **Chocolate Deep** as the primary canvas to provide more depth than a standard black. 

- **Primary (Gold):** Used exclusively for high-priority actions like "Order Now" and key brand elements. It should feel like a metallic accent on a dark surface.
- **Secondary (Deep Brown):** Used for container surfaces and card backgrounds to create a subtle layered effect against the darker base.
- **Neutral (Cream Silk):** Replaces pure white for all body text and secondary labels to reduce harshness and maintain the warm, boutique atmosphere.

Accessibility is maintained by ensuring all Gold-on-Brown and Cream-on-Brown combinations meet WCAG AA standards.

## Typography

This design system utilizes a high-contrast pairing to distinguish between "The Experience" (Headings) and "The Information" (Body).

- **Headlines:** Use **Libre Caslon Text** for an authoritative, literary feel. Use italics for specific "emphasis" words within headlines to add a rhythmic, boutique character (e.g., *Luxury* in every sip).
- **Body & UI:** Use **DM Sans** for its clean, geometric legibility. It provides a modern counter-balance to the traditional serif.
- **Labels:** Small caps with generous letter spacing are used for category tags and eyebrow titles (e.g., "OUR STORY") to create a refined, architectural look.

## Layout & Spacing

The layout follows a **Fixed Grid** approach for desktop to contain the experience and maintain an "editorial" feel, preventing content from becoming overly stretched.

- **Grid:** A 12-column grid with 24px gutters.
- **Whitespace:** Emphasize verticality. Section gaps are generous (120px+) to allow the brand imagery to "breathe."
- **Ordering Flow:** Use a focused, single-column layout for checkout to minimize distractions and lead the user through a streamlined, seamless process.
- **Mobile:** Transition to a 4-column grid with 20px margins. Reduce section gaps to 64px to maintain momentum.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** and **Subtle Glows** rather than traditional drop shadows.

- **Surfaces:** Use `#241611` for primary cards against the `#1A0F0A` background.
- **Glassmorphism:** Overlays (like the Cart drawer or Checkout modal) should use a `backdrop-filter: blur(20px)` combined with a semi-transparent `warm-overlay`.
- **Primary Action Glow:** High-priority buttons (e.g., "Order Now") should have a soft, low-opacity gold outer glow (`0px 4px 20px rgba(212, 175, 55, 0.3)`) to suggest they are illuminated from within.
- **Parallax:** Hero images and product cut-outs should move at slightly different scroll speeds (0.1x) to create a sense of physical immersion.

## Shapes

The shape language is **Softly Rounded**, avoiding the "playfulness" of pills while moving away from the "rigidity" of sharp corners.

- **Standard Elements:** 16px radius for buttons and input fields.
- **Large Containers:** 24px radius for product cards and modals.
- **Organic Cutouts:** Use asymmetric rounded shapes (like the "squircle" seen in the hero image) for featured photography to break the grid and add an artisanal touch.

## Components

- **Buttons:** 
  - **Primary:** Solid Gold background with Cacao-Black text. High-contrast and bold.
  - **Secondary:** Transparent with a 1px Gold or Cream-Silk border. Subtle and refined.
- **Inputs:** Darker brown backgrounds with thin 1px borders. Focus states should transition the border color to Gold with a very subtle inner glow.
- **Chips/Badges:** Use the "Label Caps" typography style. Small, 4px rounded corners, with a semi-transparent Gold background for status or categories.
- **Product Cards:** No visible borders. Use tonal shifts and image-top layouts. The "Add to Order" action should be a full-width button at the bottom of the card to maximize the hit area.
- **Cart Drawer:** Slides from the right with a deep glassmorphism effect, blurring the shop behind it to keep the user focused on the final transaction steps.