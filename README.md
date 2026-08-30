# FlowGram

Visual workflow builder — create, connect, and organize nodes on an infinite canvas. Multi-project dashboard, folders, Google OAuth, Neon database, dark mode, and mobile-friendly.

![FlowGram](public/assets/images/brand/Brand.png)

## Features

- **Infinite canvas** — pan, zoom, and arrange nodes freely
- **Node connections** — bezier curves with animated flowing dash
- **Multi-project dashboard** — manage multiple workflows from one place
- **Folders** — organize projects into folders
- **Archive** — archive projects you're not actively working on
- **Google OAuth** — sign in with Google account
- **Neon database** — projects saved to cloud PostgreSQL (login required)
- **Demo mode** — try without login, data stored in localStorage
- **Settings modal** — two-column UI (ChatGPT style): edit name, theme, font, export data, delete account
- **Font picker** — choose from 9 fonts (Inter, Lato, Montserrat, Poppins, etc.)
- **Dark mode** — light and dark theme with system preference detection
- **Context menu** — right-click on nodes, connections, and cards for quick actions
- **Multi-select** — shift+click or shift+drag to select multiple nodes
- **Export / Import** — save and load workflows as JSON
- **Mobile-friendly** — responsive layout, touch gestures, pinch-to-zoom, bottom sheets
- **Auto-save** — changes saved automatically to Neon (login) or localStorage (demo)

## Getting Started

FlowGram runs in the browser for the frontend, with a serverless backend on Vercel Functions.

### Prerequisites

- Node.js 18+ (for local backend development)
- A [Neon](https://neon.tech) PostgreSQL database
- A Google Cloud OAuth client ID
- (Optional) [Vercel](https://vercel.com) account for deployment

### Run locally

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/flowgram.git
   cd flowgram
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up `.env.local` from `.env.example` and fill in the Neon credentials (see below)

4. Start the local Hono server:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser.

### Docker

With Docker installed and `.env.local` configured:

```bash
docker compose up --build
```

The application and Hono API are served together at `http://localhost:3001` by default. The host port can be changed with `FLOWGRAM_HOST_PORT`; the container port remains `3000`. Neon remains the database provider.

> ⚠️ Do not open `index.html` directly via `file://` — localStorage may be blocked by the browser's tracking prevention.

### Environment Variables

Set these in `.env.local` for local development. Never commit this file:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require
JWT_SECRET=your_random_jwt_secret
```

## Project Structure

```
├── api/                # Hono MVC backend modules
│   ├── _db.js          # Neon connection pool
│   ├── index.js        # Thin route composition
│   ├── controllers/ services/ repositories/
│   └── middleware/ models/ validators/ config/
├── public/             # Active CSS and static assets
│   ├── favicon/
│   └── images/
│       ├── brand/
│       └── logo/
├── auth/
│   └── google-callback.html   # Google OAuth callback
├── frontend/           # Active browser core and page controllers
├── css/                # Compatibility static copy
│   ├── auth.css        # Auth gate split-page style
│   ├── base.css
│   ├── components.css
│   ├── home.css
│   ├── layout.css
│   ├── loader.css
│   ├── onboarding.css  # Onboarding split-page style
│   ├── reset.css
│   ├── responsive.css
│   └── variable.css
├── onboarding.html     # Onboarding page (input name)
├── builder.html        # Canvas / workflow editor
├── index.html          # Homepage / project dashboard
├── server/             # Node HTTP entrypoint and static serving
├── Dockerfile          # Local production-like image
├── docker-compose.yml  # Local app container
├── package.json        # Dependencies and start scripts
└── .env.example        # Non-secret environment template
```

## Usage

### Homepage

- Click **New Project** to create a new workflow
- Click a project card to open it in the builder
- Right-click a card (or click ⋯) to rename, duplicate, archive, move to folder, or delete
- Use the search bar to filter projects
- Create folders from the sidebar to organize your projects
- Your avatar and name appear in the bottom of the sidebar
- Click the gear icon to open **Settings** (edit name, theme, font, export, delete account)

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

- **Frontend:** Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools
- **Backend:** [Hono.js](https://hono.dev) on Node.js (`@hono/node-server`)
- **Database:** [Neon](https://neon.tech) PostgreSQL (serverless)
- **Auth:** Google OAuth 2.0
- **Icons:** [Lucide Icons](https://lucide.dev) + [Bootstrap Icons](https://icons.getbootstrap.com)
- **Fonts:** Google Fonts (Inter, Lato, Montserrat, Poppins, and more)
- **Data layer:** localStorage (demo mode) / Neon REST API (login mode)

## Browser Support

Works in all modern browsers (Chrome, Firefox, Edge, Safari). Requires Node.js or Docker for the local Hono server.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Alfiz Ilham**
