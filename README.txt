BountyVault - Bug Bounty Management & Kali WSL Automation
=========================================================

A beautiful desktop application for managing bug bounty programs, tracking vulnerability reports, 
monitoring bounties, and automating reconnaissance workflows inside Kali Linux via WSL.

FEATURES
--------
- Dashboard with real-time statistics and charts
- Target (Company) management with platform integration
- Vulnerability report creation, editing, and tracking
- Bounty tracking (awarded, pending, paid)
- Monthly earnings breakdown with charts
- WSL/Kali Linux workflow automation engine
- Import .txt workflow files and auto-detect steps
- Live terminal output streaming from WSL
- Global search with Ctrl+K command palette
- Dark/Light theme support
- Local-first SQLite database (data never leaves your machine)
- Automatic database backups

TECHNOLOGY STACK
----------------
- Electron 28 (Desktop Framework)
- React 18 (UI Library)
- TypeScript 5.3
- Vite (Build Tool)
- Tailwind CSS 3.4 (Styling)
- Radix UI / shadcn/ui (Components)
- Zustand (State Management)
- SQLite via node-sqlite3-wasm (Database)
- Recharts (Charts)
- React Hook Form (Forms)
- Framer Motion (Animations)

PREREQUISITES
-------------
- Node.js v18 or higher
- npm v9 or higher
- Windows 10/11
- WSL2 with Kali Linux (for workflow automation features)

INSTALLATION
------------
1. Clone or download this repository
2. Open terminal in the project folder
3. Install dependencies:
   npm install
4. Start the application:
   npm run dev

BUILD FOR PRODUCTION
---------------------
To create a portable Windows executable:

   npm run build
   npm run package

The .exe file will be in the dist/ folder.

WORKFLOW AUTOMATION
-------------------
BountyVault can execute security reconnaissance workflows inside Kali Linux WSL.

How it works:
- Save .txt workflow files in the workflows/ folder
- Each line starting with a number is treated as a step
- Use <example.com> as placeholder - it gets replaced by your target
- Example workflow line:
    1. subfinder -d <example.com> -all -silent > subdomains.txt

Built-in sample workflow included: VAPT.txt (Vulnerability Assessment & Penetration Testing)

WSL Requirements:
- WSL2 must be enabled on your Windows machine
- Kali Linux distribution must be installed
- Tools (subfinder, httpx, nuclei, etc.) must be installed inside Kali

PROJECT STRUCTURE
-----------------
BountyVault/
  src/
    main/           # Electron main process (Node.js)
      index.ts      # App entry, window creation
      db/           # SQLite database schema and queries
      ipc/          # IPC handlers (DB, files, workflows)
    preload/        # Preload scripts (bridge between main/renderer)
    renderer/       # React UI
      src/
        components/ # UI components (buttons, dialogs, tables, etc.)
        pages/      # App pages (Dashboard, Reports, Workflows, etc.)
        store/      # Zustand state stores
        types/      # TypeScript type definitions
        lib/        # Utility functions
  resources/        # App icons (icon.ico, icon.png)
  workflows/        # .txt workflow files for WSL automation

DATABASE
--------
SQLite database is stored at:
  %APPDATA%\bountyvault-clean\data\bountyvault.db

Tables: platforms, vulnerability_types, companies, programs, reports,
        report_timeline, responses, bounties, attachments, notes,
        retests, workflow_definitions, workflow_runs, workflow_outputs, settings

LICENSE
-------
For authorized security testing only. Use responsibly.
