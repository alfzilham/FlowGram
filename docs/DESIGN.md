# FlowGram Design

The interface is a minimal indigo productivity workspace. Dashboard layout uses a sidebar, top bar, project grid, context menus, and modal dialogs. Builder layout uses a toolbar, infinite canvas, SVG connection layer, node layer, and responsive mobile sheets.

Design tokens and responsive rules are in `public/css/variable.css`, `public/css/layout.css`, `public/css/responsive.css`, and related files. Theme/font preferences remain in localStorage.

Primary interaction rules: destructive actions require confirmation; node text is inline-editable; Escape closes menus/modals; toolbar controls have titles; mobile supplies touch-friendly sheets.

Security-sensitive UI rule: user-controlled names, node text, imported values, and menu labels must be rendered with DOM APIs/text nodes, not HTML interpolation. SVG markup is allowed only from fixed trusted icon constants. Accessibility follow-up includes focus management, ARIA for icon-only controls, contrast review, and screen-reader toast announcements.
