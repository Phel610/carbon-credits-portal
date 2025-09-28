# Financial Platform

A comprehensive financial modeling and assessment platform for carbon credit projects.

## Model Parity System

The project includes a robust model parity verification system that compares financial engine calculations against Excel reference data.

### Quick Start

1. **Start the development servers:**
   ```bash
   # Terminal 1: Start the Parity API server
   npm run parity:server
   
   # Terminal 2: Start the main app
   VITE_QA_MODE=true npm run dev
   ```

2. **Run parity checks via CLI:**
   ```bash
   # Single scenario
   npm run parity:run -- --scenario scenario_simple
   
   # All scenarios
   npm run parity:all
   
   # Quick verification
   npm run parity:verify
   ```

3. **Access the QA page:**
   Navigate to `/qa/parity` when `VITE_QA_MODE=true` is set.

### System Architecture

The parity system uses:
- **Express API Server** (`server/index.ts`) - Handles parity check requests
- **Vite Proxy** - Routes `/api` calls to the Express server
- **QA Interface** (`src/qa/ParityPage.tsx`) - Web UI for running checks
- **CLI Runner** (`parity/scripts/runParity.ts`) - Command-line interface

### API Endpoints

- `POST /api/parity/run` - Run parity check for a scenario
- `GET /api/parity/scenarios` - List available scenarios
- `GET /health` - Health check

## Project info

**URL**: https://lovable.dev/projects/a92fd331-62e2-4d87-8f4e-2f68fcfd1339

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a92fd331-62e2-4d87-8f4e-2f68fcfd1339) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a92fd331-62e2-4d87-8f4e-2f68fcfd1339) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
