# AttendMe

A modern QR code-based attendance tracking system for educational institutions, built with Vue 3 and TypeScript.

## Tech Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Language**: TypeScript 5
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: Vue Router 4
- **QR Code**: qrcode, vue-qrcode-reader
- **Code Quality**: ESLint 9, Prettier

## Getting Started

### Prerequisites

- Node.js: ^20.19.0 or >=22.12.0
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/taczhed/attend-me.git
cd attend-me

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot-reload
npm run dev
```

The application will be available at `http://localhost:5173/attend-me/`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Type-check, compile and minify for production |
| `npm run type-check` | Run TypeScript type checking |
| `npm run build-only` | Build without type-checking |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint and auto-fix code issues |
| `npm run format` | Format code with Prettier |


## Backend Integration

The application connects to a RESTful API backend:
- Auto-generated API client with TypeScript types
- Automatic date deserialization
- Token-based authorization

API DOCS: https://attendme-backend.runasp.net/swagger/index.html

## Authors
 - [taczhed](https://github.com/taczhed)
 - [osiakmikolaj](https://github.com/osiakmikolaj)
 - [NotTabak](https://github.com/NotTabak)
