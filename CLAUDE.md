# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pitana is a Discord bot for the IOSoccer South America community that manages matchmaking (MM) bans with a progressive ban level system. It uses Discord.js, MongoDB, and Luxon (timezone hardcoded to `America/Argentina/Buenos_Aires`).

## Commands

```bash
npm start              # Run with ts-node using .env
npm run start:prod     # Run using .env.prod (ENV=production)
npm run dev            # Run with nodemon auto-reload
npm run deploy-commands # Register slash commands with Discord
```

No test runner is configured. There is an `.eslintrc.json` for linting.

## Architecture

### Entry Points
- `index.ts` — Bot startup: loads commands, registers Discord events, starts the 10-minute `checkTasks()` loop
- `deploy-commands.ts` — Registers slash commands via Discord REST API
- `restoreUnbanTasks.ts` — Utility to re-sync unban tasks after bot downtime

### Layers

**`commands/`** — Thin Discord slash command handlers. Each file exports a `data` (SlashCommandBuilder) and `execute(interaction)`. They validate permissions (admin role) and channels, then delegate to `lib/`.

**`lib/`** — All business logic lives here:
- `ban.ts` / `banInfo.ts` / `banRemove.ts` / `banRanking.ts` — Core logic matching each command
- `calculateBanLevel.ts` — Determines next ban level based on last ban and `RESET_DAYS` config
- `autoUnban.ts` — Removes expired bans (called by `checkTasks.ts`)
- `checkTasks.ts` — Polls `unbanTasksCollection` every 10 minutes and fires `autoUnban`
- `mongodb.ts` — Singleton MongoDB connection
- `logCommand.ts` — Audit logging to a bot channel

**`environment.ts`** — Loads `.env` or `.env.prod` into a typed config object. All 14 required variables (tokens, role/channel IDs, MongoDB creds, `BAN_DAYS` JSON array, `RESET_DAYS` JSON array) must be present or the app exits.

**`types.ts`** — Shared TypeScript interfaces: `UnbanTask`, `BanLogItem`, `CustomTime`.

### Key Data Flows

**Banning a user:**
1. Command validates admin role and allowed channel
2. `calculateBanLevel` queries last ban from `banLogCollection` and applies reset logic
3. Ban record inserted into `banLogCollection`
4. Unban task inserted into `unbanTasksCollection` (skipped for permanent bans)
5. Discord MM ban role applied; embeds sent to command channel and arbitration channel

**Auto-unban:**
- `checkTasks()` runs every 10 minutes, queries `unbanTasksCollection` for expired tasks
- `autoUnban` removes the Discord role, deletes the task, and logs the action

**Rejoin handling:**
- `guildMemberAdd` event reapplies the ban role if the user has an active unban task

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) deploys on push to `master` via SSH. If `package.json` changed it runs `npm ci` before restarting the `pitana` systemd service.
