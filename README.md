# 🎬 Wan 2.6 Studio

AI video generator powered by [Wan 2.6](https://fal.ai/models/fal-ai/wan/v2.6/text-to-video) via fal.ai.
Generate cinematic videos from text prompts or images, track generation progress in real-time, and play back results directly in the browser.

**Stack:** Spring Boot 3.2 (Java 21) · React + Vite · PostgreSQL · Docker Compose

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [fal.ai API Key Setup](#falai-api-key-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Required version | Install |
|------|-----------------|---------|
| Docker | 24+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | v2 (plugin) | Included with Docker Desktop |
| fal.ai API key | — | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) |

> **macOS:** Install [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/).  
> **Ubuntu:** `curl -fsSL https://get.docker.com | sh && sudo apt install docker-compose-plugin`

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd test-for-ai-wan.git

# 2. Create your .env file
cp .env.example .env
# Edit .env and set FAL_API_KEY (already set if provided by maintainer)

# 3. Start the application
./run.sh start
```

The script will:
1. Build the Docker images (first run takes ~5 minutes)
2. Start PostgreSQL, the Spring Boot backend, and the React frontend
3. Wait until the backend is healthy
4. **Automatically open `http://localhost:3000` in your browser**

```bash
# Stop everything
./run.sh stop
```

---

## fal.ai API Key Setup

This application requires a **fal.ai API key** to generate videos via the Wan 2.6 model.

### 1. Create a fal.ai account

1. Go to **[fal.ai](https://fal.ai/)** and click **"Get started"** (top-right corner).
2. Sign up using one of the supported methods:
   - **GitHub OAuth**
   - **Google OAuth**
   - **SSO / SAML** (for enterprise teams)
3. Once signed up, a personal account is automatically created — no extra setup needed.

> **Team accounts:** If you want to share a single API key with colleagues, create a **Team account** from the dashboard. Team accounts share one set of API keys, deployments, and billing.

### 2. Generate an API key

1. Log in to the **[fal.ai dashboard](https://fal.ai/dashboard)**.
2. Navigate to **Settings → API Keys** (or go directly to [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)).
3. Click **"Create new key"**, give it a descriptive name (e.g. `wan-studio-local`), and confirm.
4. **Copy the key immediately** — it will not be shown again.
5. Paste it into your `.env` file:

   ```env
   FAL_API_KEY=your_key_here
   ```

> ⚠️ **Keep your API key secret.** Never commit it to version control. The `.gitignore` already excludes `.env` and `api-key-fal-ai.txt`.

### 3. Add credits to your account

fal.ai uses a **prepaid credit** model: credits are drawn down as you make API calls. No credit card is charged per-request; you buy a credit bundle up-front.

#### Wan 2.6 pricing (output-based)

| Resolution | Cost per second of video |
|-----------|--------------------------|
| 480p       | **$0.05 / sec**          |
| 720p       | **$0.10 / sec**          |
| 1080p      | **$0.15 / sec**          |

*A typical 5-second 720p video costs ~$0.50.*

#### How much credit to buy

| Use case | Recommended starting credit |
|----------|-----------------------------|
| Personal testing / learning | **$5 – $10** (≈ 10–20 videos at 720p) |
| Regular personal use         | **$20 – $50** |
| Team / production workloads  | **$100+** (or contact [support@fal.ai](mailto:support@fal.ai) for enterprise pricing) |

**To add credits:**
1. Go to **[fal.ai/dashboard](https://fal.ai/dashboard)**.
2. Click **"Billing"** → **"Add credits"**.
3. Choose a credit amount and complete the payment.

> 💡 **Note:** Purchased credits expire **365 days** from the date of purchase. Free/coupon credits may have shorter expiry windows (1 week – 1 year). fal.ai only charges for **successful outputs** — HTTP 5xx server errors are never billed.

---

## Configuration

All configuration lives in `.env` at the repository root.

| Variable | Description | Example |
|----------|-------------|---------|
| `FAL_API_KEY` | Your fal.ai API key (required) | `abc123:xyz456` |
| `POSTGRES_DB` | Database name | `wan_videos` |
| `POSTGRES_USER` | Database user | `wan_user` |
| `POSTGRES_PASSWORD` | Database password | `changeme` |

> ⚠️ **Never commit `.env` to version control.** It is already listed in `.gitignore`.

---

## Usage

### Text to Video

1. Click the **"📝 Text to Video"** tab.
2. Enter a detailed prompt describing the scene you want.
3. Choose an aspect ratio, resolution, and duration.
4. Click **"🎬 Generate Video"**.

The job appears in the gallery below with a **Processing** badge. Generation typically takes 2–5 minutes. The page polls for updates automatically.

### Image to Video

1. Click the **"🖼️ Image to Video"** tab.
2. Provide a source image via URL or drag-and-drop upload.
3. Describe the motion you want (e.g. *"camera slowly zooms out, leaves sway gently"*).
4. Click **"🎞️ Animate Image"**.

### Supported Aspect Ratios

`21:9` · `16:9` · `3:2` · `4:3` · `5:4` · `1:1` · `4:5` · `3:4` · `2:3` · `9:16` · `9:21`

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  React Frontend │────▶│  Spring Boot Backend │────▶│  fal.ai API │
│   (nginx :3000) │     │       (:8080)         │     │   (cloud)   │
└─────────────────┘     └──────────┬───────────┘     └─────────────┘
                                   │
                          ┌────────▼────────┐
                          │   PostgreSQL    │
                          │  (video_jobs)   │
                          └─────────────────┘
```

- **Frontend** — React SPA served by nginx. nginx proxies `/api/*` requests to the backend.
- **Backend** — Exposes REST endpoints for job creation and retrieval. Submits requests to fal.ai asynchronously and polls for results every 15 seconds via a Spring Scheduler. The fal.ai API key never leaves the server.
- **Database** — PostgreSQL stores job records (prompt, status, result URL, metadata). Schema managed by Flyway migrations.

### Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/videos/text-to-video` | Submit a T2V job |
| `POST` | `/api/videos/image-to-video` | Submit an I2V job |
| `GET` | `/api/videos` | List all jobs |
| `GET` | `/api/videos/{id}` | Get a single job |
| `GET` | `/api/actuator/health` | Backend health check |

---

## Development

### Running locally (without Docker)

**Backend:**
```bash
cd backend
# Start a local PostgreSQL instance first (or use Docker for just the DB)
docker compose up -d postgres
mvn spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173 (proxies /api to localhost:8080)
```

### Project structure

```
.
├── run.sh                   # Start / stop management script
├── docker-compose.yml       # Service orchestration
├── .env                     # Environment secrets (gitignored)
├── .env.example             # Template
│
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/wan26/
│       ├── controller/      # VideoController, UploadController
│       ├── service/         # FalAiService, VideoJobService
│       ├── scheduler/       # JobPollingScheduler
│       ├── model/           # VideoJob entity, enums
│       ├── dto/             # Request/response DTOs
│       ├── config/          # WebClient, CORS
│       └── exception/       # Global error handler
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── components/      # Header, forms, JobCard, JobList
        ├── hooks/           # useJobs (auto-polling)
        └── services/        # api.js (Axios)
```

---

## Troubleshooting

### Docker build fails with "Network unreachable"

Your Docker BuildKit containers may be network-isolated. The `docker-compose.yml` already includes `network: host` for the backend build to work around this. If you still see issues:

```bash
# Rebuild with explicit network
docker compose --progress plain build backend
```

### `npm error Exit handler never called!`

This is a [known npm bug on Alpine Linux](https://github.com/npm/cli/issues). It is a warning only — the build continues and the frontend is built correctly by Vite.

### Backend won't start — database connection error

Make sure PostgreSQL is healthy before the backend starts. `docker compose` handles this automatically via `depends_on: condition: service_healthy`. If you started services manually:

```bash
docker compose up -d postgres
# Wait ~10s then:
docker compose up -d backend
```

### Video generation takes too long / stays "In Queue"

fal.ai video generation takes 2–5 minutes per job. The backend polls every 15 seconds and the frontend refreshes every 10 seconds. If a job is stuck, check the backend logs:

```bash
docker compose logs -f backend
```
