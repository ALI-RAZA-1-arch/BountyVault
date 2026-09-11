# BountyVault

**Bug Bounty Management & Kali WSL Automation Desktop App**

A beautiful Electron desktop application for managing bug bounty programs, tracking vulnerability reports, monitoring bounties, and automating reconnaissance workflows inside Kali Linux via WSL.

---

## Features

- Dashboard with real-time statistics and charts
- Target (Company) management with platform integration
- Vulnerability report creation, editing, and tracking
- Bounty tracking (awarded, pending, paid)
- Monthly earnings breakdown with charts
- WSL/Kali Linux workflow automation engine
- Import `.txt` workflow files and auto-detect steps
- Live terminal output streaming from WSL
- Global search with `Ctrl+K` command palette
- Dark/Light theme support
- Local-first SQLite database (data never leaves your machine)
- Automatic database backups

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Electron 28 | Desktop Framework |
| React 18 | UI Library |
| TypeScript 5.3 | Type Safety |
| Vite | Build Tool |
| Tailwind CSS 3.4 | Styling |
| Radix UI / shadcn/ui | Components |
| Zustand | State Management |
| SQLite (node-sqlite3-wasm) | Database |
| Recharts | Charts |
| React Hook Form | Forms |

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+
- Windows 10/11
- WSL2 with Kali Linux (for workflow automation)

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/BountyVault.git
cd BountyVault

# Install dependencies
npm install

# Start development
npm run dev
```

## Build

```bash
npm run build
npm run package
```

The portable `.exe` will be in the `dist/` folder.

## Workflow Automation

BountyVault can execute security recon workflows inside Kali Linux WSL.

### How it works:
1. Save `.txt` workflow files in the `workflows/` folder
2. Each numbered line is a step
3. Use `<example.com>` as placeholder (replaced by your target)

### Example workflow:
```
1. subfinder -d <example.com> -all -silent > subdomains.txt
2. httpx -l subdomains.txt -silent > alive.txt
3. nuclei -l alive.txt -severity critical,high -o findings.txt
```

## Project Structure

```
BountyVault/
  src/
    main/           # Electron main process
      db/           # SQLite database
      ipc/          # IPC handlers
    preload/        # Preload scripts
    renderer/       # React UI
      components/   # UI components
      pages/        # App pages
      store/        # State stores
  resources/        # App icons
  workflows/        # .txt workflow files
```

## License

For authorized security testing only. Use responsibly.
