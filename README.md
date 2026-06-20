# FlowGram

Visual workflow builder — create, connect, and organize nodes on an infinite canvas. Multi-project dashboard, folders, dark mode, and mobile-friendly.

![FlowGram](assets/images/brand/Brand.png)

## Features

- **Infinite canvas** — pan, zoom, and arrange nodes freely
- **Node connections** — bezier curves with animated flowing dash
- **Multi-project dashboard** — manage multiple workflows from one place
- **Folders** — organize projects into folders
- **Archive** — archive projects you're not actively working on
- **Dark mode** — light and dark theme with system preference detection
- **Context menu** — right-click on nodes, connections, and cards for quick actions
- **Multi-select** — shift+click or shift+drag to select multiple nodes
- **Export / Import** — save and load workflows as JSON
- **Mobile-friendly** — responsive layout, touch gestures, pinch-to-zoom
- **Auto-save** — changes are saved automatically to localStorage

## Getting Started

FlowGram runs entirely in the browser — no build tools, no dependencies, no server required.

### Run locally

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/flowgram.git
   cd flowgram
   ```

2. Serve with any static file server. For example, using the VS Code **Live Server** extension, or:

   ```bash
   npx serve .
   ```

3. Open `http://localhost:3000` (or whatever port your server uses) in your browser.

> ⚠️ Do not open `index.html` directly via `file://` — localStorage may be blocked by the browser's tracking prevention.

## Project Structure

```
├── assets/
│   ├── favicon/
│   └── images/
│       ├── brand/
│       └── logo/
├── css/
│   ├── base.css
│   ├── components.css
│   ├── home.css
│   ├── layout.css
│   ├── loader.css
│   ├── reset.css
│   ├── responsive.css
│   └── variable.css
├── js/
│   ├── home.js       # Homepage logic (dashboard, folders, project actions)
│   ├── main.js       # Builder logic (canvas, nodes, connections)
│   └── shared.js     # Shared data layer (localStorage, project CRUD)
├── builder.html      # Canvas / workflow editor
└── index.html        # Homepage / project dashboard
```

## Usage

### Homepage

- Click **New Project** to create a new workflow
- Click a project card to open it in the builder
- Right-click a card (or click ⋯) to rename, duplicate, archive, move to folder, or delete
- Use the search bar to filter projects
- Create folders from the sidebar to organize your projects

### Builder

- **Add node** — click `+ Node`, double-click the canvas, or right-click the canvas
- **Connect nodes** — drag from a connector dot (edge of a node) to another node
- **Edit node text** — double-click the node text
- **Node options** — right-click a node or click the ⋯ button
- **Multi-select** — hold `Shift` and click or drag to select multiple nodes
- **Select all** — `Ctrl/Cmd + A`
- **Delete selected** — `Delete` or `Backspace`
- **Pan** — click and drag the canvas
- **Zoom** — scroll wheel, or pinch on mobile
- **Export / Import** — save your workflow as a JSON file

## Tech Stack

- Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools
- [Lucide Icons](https://lucide.dev/) — icon library (loaded via CDN)
- `localStorage` — all data stored locally in the browser

## Browser Support

Works in all modern browsers (Chrome, Firefox, Edge, Safari). Requires a static file server — does not work when opened directly via `file://`.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Alfiz Ilham**
