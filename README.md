# FlowGram

Visual workflow builder — create, connect, and organize nodes on an infinite canvas. Multi-project dashboard, folders, Google OAuth, Neon database, dark mode, and mobile-friendly.

![FlowGram](assets/images/brand/Brand.png)

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

3. Set up environment variables (see below)

4. Serve the frontend with any static file server:

   ```bash
   npx serve .
   ```

5. Run the API locally (optional, for auth + database features):

   ```bash
   npx vercel dev
   ```

6. Open `http://localhost:3000` in your browser.

> ⚠️ Do not open `index.html` directly via `file://` — localStorage may be blocked by the browser's tracking prevention.

### Environment Variables

Set these in your Vercel dashboard or `.env` file:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require
JWT_SECRET=your_random_jwt_secret
```

## Project Structure

```
├── api/                # Hono.js backend (Vercel Functions)
│   ├── _db.js          # Neon connection pool
│   └── index.js        # App routes (auth, projects, folders)
├── assets/
│   ├── favicon/
│   └── images/
│       ├── brand/
│       └── logo/
├── auth/
│   └── google-callback.html   # Google OAuth callback
├── css/
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
├── js/
│   ├── auth.js         # Client-side auth (Google OAuth, token, demo)
│   ├── home.js         # Homepage logic (dashboard, folders, project actions)
│   ├── main.js         # Builder logic (canvas, nodes, connections)
│   ├── onboarding.js   # Onboarding name input
│   └── shared.js       # Shared data layer (localStorage + API)
├── onboarding/
│   └── name.html       # Onboarding page (input name)
├── builder.html        # Canvas / workflow editor
├── index.html          # Homepage / project dashboard
├── package.json        # Dependencies (hono, neon, jsonwebtoken)
└── vercel.json         # Vercel deployment config
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
- **Backend:** [Hono.js](https://hono.dev) on Vercel Functions
- **Database:** [Neon](https://neon.tech) PostgreSQL (serverless)
- **Auth:** Google OAuth 2.0
- **Icons:** [Lucide Icons](https://lucide.dev) + [Bootstrap Icons](https://icons.getbootstrap.com)
- **Fonts:** Google Fonts (Inter, Lato, Montserrat, Poppins, and more)
- **Data layer:** localStorage (demo mode) / Neon REST API (login mode)

## Browser Support

Works in all modern browsers (Chrome, Firefox, Edge, Safari). Requires a static file server for the frontend and Vercel Functions for the backend.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Alfiz Ilham**
