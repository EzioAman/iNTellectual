# ⚡ InTellectual — Tactical Esports Intelligence & Team Command Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Security](https://img.shields.io/badge/Auth-PBKDF2--SHA512%20RBAC-emerald?style=for-the-badge)
![Author](https://img.shields.io/badge/Author-Morfit-cyan?style=for-the-badge)

### 🎮 Made by author - Morfit

**The all-in-one competitive Valorant squad operating system: ValoPlant-grade tactical whiteboard, 2D round replay simulator, lineup vault, contextual floating RAG coach bot, quantitative roster telemetry, and cybersecurity-compliant authentication.**

[Quick Start](#-setup--installation-zero-config) • [Tech Stack](#-complete-technology-stack) • [Security & Access Control](#-security-architecture--role-based-access-control) • [ValoPlant Feature Suite](#-valoplant-grade-tactical-suite) • [Architecture](#-data-storage-engine--architecture)

</div>

---

## 🛠 Complete Technology Stack

| Layer | Technology | Purpose & Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Full-stack server and client architecture, React Server Components, and optimized Route Handlers (`/api/auth`, `/api/admin`, `/api/roster`, `/api/strategies`, `/api/coach-bot`). |
| **UI Library** | **React 19** | Concurrent rendering, state transitions, interactive canvas contexts, and responsive hooks. |
| **Language** | **TypeScript 5.7** | Strict static typing across database schemas, telemetry metrics, and vector engines. |
| **Styling & HUD** | **Tailwind CSS 3.4 & Vanilla CSS** | Custom glassmorphism, glowing HUD elements, kinetic transitions, and theme color matrix. |
| **Interactive FX** | **React.Bits Kinetic Engine** | Dynamic cursor Spotlight cards, hover-reactive agent backdrop with high-res portraits, and radial cyber glow. |
| **Vector Whiteboard** | **HTML5 Canvas 2D & SVG** | Sub-pixel tactical whiteboard with vision cone projections, ability markers, and path tracers. |
| **Audio Subsystem** | **Web Audio API & Synthesizer** | Dual-engine music player: HTML5 audio player for VCT tracks + procedural ambient Lo-Fi Web Audio synthesizer ("SYNTH BEATS") with zero network dependencies (preset 15% default volume). |
| **Database Engine** | **Autonomous Atomic JSON Engine** | File-backed atomic database (`lib/db.ts` $\leftrightarrow$ `data/squad_db.json`) providing zero-dependency persistence. |
| **Alternative CLI** | **Python 3.12 & UV** | Optional CLI wrapper (`src/intellectual/__init__.py`) supporting legacy deployments and automated package management. |

---

## 🛡️ Security Architecture & Role-Based Access Control

The platform implements security guidelines for user authentication and team management:

### 1. Cryptographic Protection & Guardrails
- **Password Hashing**: Passwords are never stored in plaintext. Passwords use cryptographic salting and **PBKDF2 with 100,000 rounds of SHA-512** via Node.js native `crypto`.
- **Timing-Safe Verification**: Verification uses `crypto.timingSafeEqual` to prevent side-channel timing analysis attacks.
- **Brute-Force Lockout**: Accounts temporarily lock for 15 minutes after 5 consecutive failed login attempts.
- **Password Strength Policy**: Live strength meter enforcing at least 8 characters, uppercase and lowercase letters, numbers, and special characters.
- **Cryptographic Session Tokens**: Authenticated sessions receive 256-bit cryptographically secure random bearer tokens with 48-hour expiration.

### 2. Access Tiers
| Role | Capabilities & Scope |
| :--- | :--- |
| **👑 SUPER ADMIN** | **Full Platform Authority**: Access to the System Atlas, add/remove operatives, add/remove coaches, configure coach credentials, and modify team identity (Team Name, Tag, Region, Motto). |
| **🛡️ ADMIN (Coach Manager)** | **Team Operations**: Add & remove operatives from the active roster, configure coach accounts, and submit quantitative player evaluations. |
| **👤 REGISTERED USER** | **Tactical Intelligence**: Personalized whiteboard, saved strategy management, interactive AI coach bot, and team scrim reviews. |
| **👥 GUEST** | **Public Access**: 2D Radar Whiteboard, Pro Lineup Vault, 2D Match Replay Simulator, Operative Dossiers, Roster Telemetry, Arena Broadcast Mode (`B`), and Looping VCT Music Radio. |

> **Administrative Logins**: Pre-seeded default administrative accounts include `morfit` (Super Admin) and `coach` (Coach Admin). Users can authenticate or create new accounts through the Security Portal (`🔑 ACCESS PORTAL`).

---

## 💾 Data Storage Engine & Architecture

### Autonomous Atomic JSON Engine (`lib/db.ts` $\rightarrow$ `data/squad_db.json`)
- **Zero External Setup**: Anyone can `git clone` and `npm run dev` immediately. No PostgreSQL/MongoDB servers to install, no cloud API keys, and no billing setup required.
- **Atomic File Persistence**: All mutations (adding players, removing coaches, updating login data, saving tactics) are committed synchronously to `data/squad_db.json` with thread-safe file writes.
- **Universal Team Customization**: Any esports team or organization can clone the repository, launch the app, and configure their roster, coaching staff, and brand identity.

---

## 🗺 ValoPlant-Grade Tactical Suite

### 1. Interactive Tactical Whiteboard
* **Official Active Map Pool**: Ascent, Bind, Haven, Lotus, Sunset, Abyss, Split with high-resolution radar satellite view.
* **Agent & Ability Stamps**: Stamp any agent with their exact abilities (Omen dark covers, Brimstone smokes, Viper toxic screens, Killjoy lockdown, Cypher trips, Sova recon bolts).
* **FOV Vision Cones**: Toggle realistic sightlines for placed agents to analyze crossfires and dead angles.
* **Vector Drawing Tools**: Freehand brush, straight tactical arrow lines, erase, and clear canvas.
* **1-Click Pro Playbook Presets**: FNATIC Ascent A-Split, PAPER REX Bind B-Hookah, SENTINELS Haven C-Retake, DRX Lotus 3-Site, GEN.G Sunset B-Main.

### 2. Verified Lineup Vault
* Built-in database of competitive lineups across Sova, Viper, Killjoy, Brimstone, Fade, and Gekko.
* Stand-at and Land-at radar coordinates with detailed crosshair placement guides.
* **1-Click Whiteboard Deployment**: Send any lineup directly from the vault to the tactical whiteboard for scrim planning.

### 3. 2D Round Replay Simulator
* Interactive 2D round simulation recreating VCT pro rounds.
* Animated operative tokens moving along real paths with combat line-of-sight.
* Timed smoke blooms (e.g. Omen A-Heaven smoke blooming at 00:24, Viper wall active at 00:05).
* Real-time scrolling combat killfeed synchronized to round events.
* Timeline scrubber with Play, Pause, and 0.5x / 1.0x / 2.0x playback speed.
* **"Capture Moment as Strategy"**: Instantly freeze any frame of the simulation and export it directly to the whiteboard.

### 4. Floating Context-Aware Tactical AI Coach (RAG)
* Bottom-right floating assistant widget (`💬 TACTICAL AI COACH // RAG`).
* Context-Aware: Automatically loads the active player's performance telemetry (ACS, K/D, Aim, Utility, Comms, Entry, Clutch, coach evaluations).
* Provides real-time tactical answers, drills, and role advice via `/api/coach-bot`.

### 5. Arena Broadcast Stage Presentation Mode
* Press **`B`** (or click **BROADCAST [B]**) to enter the cinematic VCT broadcast view:
  - **[CAM 1]**: Operative Spotlight & Live Lower-Third Ticker.
  - **[CAM 2]**: 8-Axis Combat Radar Telemetry.
  - **[CAM 3]**: Weapon Loadout & First-Blood Conversion Matrix.
  - **[CAM 4]**: Full Squad Roster Standings.
  - **PIP Radar**: Picture-in-picture 2D tactical radar minimap (`P` key).
  - Dedicated music controls & keyboard shortcuts (`←`/`→` to cycle operatives, `1`-`4` for cams, `F` for fullscreen, `Esc` to exit).

---

## 🚀 Setup & Installation (Zero-Config)

You can clone this repository or upload it directly to GitHub without changing anything:

### Quick Start (Next.js 15)

```bash
# 1. Clone repository
git clone https://github.com/your-username/InTellectual.git
cd InTellectual

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Production Build

```bash
npm run build
npm start
```

### Python / UV Alternative Launcher

```bash
uv run intellectual
```

---

## 📁 Repository File Atlas

```
InTellectual/
├── app/
│   ├── api/
│   │   ├── auth/route.ts         # User login, register & session verification
│   │   ├── admin/route.ts        # Admin & Super Admin RBAC management
│   │   ├── coach-bot/route.ts    # AI Tactical Coach RAG query API
│   │   ├── roster/route.ts       # Squad roster, history & metrics API
│   │   └── strategies/route.ts   # Tactical strategies persistence API
│   ├── layout.tsx                # Root layout with Morfit metadata
│   ├── page.tsx                  # Tactical dashboard root & navigation
│   └── globals.css               # Kinetic styling & theme tokens
├── components/
│   ├── AdminControlPanel.tsx     # Cybersecurity authentication & management portal
│   ├── FloatingCoachBot.tsx      # Bottom-right context-aware AI Coach RAG widget
│   ├── SpotlightCard.tsx         # React.Bits cursor spotlight component
│   ├── StrategyBuilder.tsx       # Whiteboard, Lineup Vault & Replay Studio
│   ├── LineupVault.tsx           # ValoPlant-inspired verified lineup vault
│   ├── RoundReplayViewer.tsx     # 2D VCT Round playback simulator
│   ├── TacticsBoard.tsx          # 2D Map radar vector canvas & sightlines
│   ├── CommandOverview.tsx       # High-level squad performance overview
│   ├── OperativeDossier.tsx      # Deep dive individual player dossier
│   ├── ComparisonTool.tsx        # Head-to-head versus comparison
│   ├── SquadTelemetry.tsx        # Quantitative roster telemetry & trends
│   ├── MatchArchives.tsx         # Match history & series results
│   ├── BroadcastMode.tsx         # Arena broadcast stage mode with PIP radar
│   ├── VCTMusicPlayer.tsx        # Audio player with procedural synth fallback
│   ├── ReactBitsBackground.tsx   # Atmospheric dynamic agent backdrop
│   └── SystemAtlasGuide.tsx      # In-app architecture guide (Super Admin gated)
├── data/
│   └── squad_db.json             # Autonomous JSON database
├── lib/
│   ├── auth.ts                   # Native cryptographic auth & session engine
│   ├── db.ts                     # Database controller & atomic file I/O
│   ├── types.ts                  # TypeScript interfaces & user roles
│   ├── lineupData.ts             # Pro lineup library (Sova, Viper, etc.)
│   ├── replayData.ts             # 2D VCT round replay simulation data
│   ├── mapData.ts                # Map pools, site layouts & meta strats
│   ├── agentData.ts              # Agent abilities, roles & artwork
│   ├── valorantEngine.ts         # Quantitative scoring & tier calculation
│   └── soundEngine.ts            # Web Audio API sound generator
└── README.md                     # Documentation
```

---

<div align="center">

Made by author - Morfit

</div>
