# FlowGram Design

The interface is a modern glassmorphic indigo productivity workspace with rounded geometry and interactive micro-animations.

## Layout & Components

- **Dashboard**: Features a frosted glass sidebar (`backdrop-filter: var(--blur-lg)`), pill navigation, top bar with focused search glow, and a responsive grid of project cards with 18px rounded corners, dynamic mesh gradient thumbnails, floating node badges, and hover lift elevation (`translateY(-4px)`).
- **Settings**: A 2-column modal dialog (inspired by modern workspace apps) with category tabs and interactive typography selector previewing available web fonts (Inter, Poppins, Plus Jakarta Sans, JetBrains Mono, etc.).
- **Builder**: Features a floating glass pill toolbar (`backdrop-filter: var(--blur-md)`), subtle radial dot canvas grid, animated Bezier curve connections (`@keyframes flowDash`), pulsing 12px connector dots (`@keyframes pulsePort`), and dynamic auto-content nodes (`width: max-content; min-width: 120px; max-width: 360px; word-break: normal; overflow-wrap: break-word`) that scale horizontally with text and wrap cleanly across multiple lines.
- **Responsive**: On mobile viewports (≤768px), the toolbar shifts to a floating bottom bar, and context menus seamlessly morph into slide-up glass bottom sheet drawers with touch-friendly targets.

## Design Tokens & Preferences

Design tokens and responsive rules are maintained in `public/css/variable.css`, `public/css/layout.css`, `public/css/components.css`, and `public/css/responsive.css` (with `css/` compatibility copies). Dark/Light theme (`wf_builder_theme`) and font preferences (`wf_font_pref`) remain in localStorage.

## Interaction & Accessibility

Primary interaction rules: destructive actions require modal confirmation; node text is inline-editable; Escape closes menus/modals; toolbar icon-only buttons include `title` and `aria-label` attributes; mobile supplies touch-friendly sheets; and `@media (prefers-reduced-motion: reduce)` disables non-essential animations.

## Security-Sensitive UI Rules

User-controlled names, node text, imported values, folder titles, and menu labels must always be rendered with DOM APIs/text nodes (`textContent` / `document.createTextNode`), never HTML interpolation. SVG markup is restricted strictly to static trusted icon constants.
