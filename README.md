# 🎬 AI Video Studio

Full-stack AI video generation platform powered by **5 state-of-the-art models** via [fal.ai](https://fal.ai/).
Generate cinematic videos from text prompts or images using Wan, Kling, LTX-2, or PixVerse — all from one interface. Track generation progress in real-time, and play back results directly in the browser.

**Stack:** Spring Boot 3.2 (Java 21) · React + Vite · PostgreSQL · Docker Compose

---

## Table of Contents

- [Supported Models](#supported-models)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [fal.ai API Key Setup](#falai-api-key-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## Supported Models

The application supports the following fal.ai video generation models. The model is selected per-job from a dropdown in the UI, and the form automatically shows only the duration and aspect-ratio values that the selected model accepts.

| Model | Mode | Duration options | Aspect ratios | fal.ai page |
|---|---|---|---|---|
| **Wan 2.6** *(default)* | T2V · I2V | 5 s, 10 s, 15 s | 16:9 · 4:3 · 1:1 · 3:4 · 9:16 | [T2V](https://fal.ai/models/fal-ai/wan/v2.6/text-to-video) · [I2V](https://fal.ai/models/fal-ai/wan/v2.6/image-to-video) |
| **Wan 2.2-A14B** | T2V · I2V | 5 s, 10 s, 15 s | 16:9 · 4:3 · 1:1 · 3:4 · 9:16 | [T2V](https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video) · [I2V](https://fal.ai/models/fal-ai/wan/v2.2-a14b/image-to-video) |
| **Kling v2.5 Turbo Pro** | T2V · I2V | 5 s, 10 s | 16:9 · 9:16 · 1:1 | [T2V](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video) · [I2V](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video) |
| **LTX-2 19B** | T2V · I2V | 5 s, 10 s, 15 s *(frame-count based)* | 16:9 · 4:3 · 1:1 · 3:4 · 9:16 | [T2V](https://fal.ai/models/fal-ai/ltx-2-19b/text-to-video) · [I2V](https://fal.ai/models/fal-ai/ltx-2-19b/image-to-video) |
| **PixVerse v5** | T2V · I2V | 5 s, 8 s | 16:9 · 4:3 · 1:1 · 3:4 · 9:16 | [T2V](https://fal.ai/models/fal-ai/pixverse/v5/text-to-video) · [I2V](https://fal.ai/models/fal-ai/pixverse/v5/image-to-video) |

### Model notes

- **Wan 2.6** — Versatile open-source video model. Great default for cinematic text prompts and image animation.
- **Wan 2.2-A14B** — Higher-parameter Wan variant. Produces sharper motion and finer detail at the cost of slightly longer generation times.
- **Kling v2.5 Turbo Pro** — Kuaishou's flagship generator. Exceptional motion fluidity and photorealism. Duration is strictly `5` or `10` seconds (fal.ai hard requirement).
- **LTX-2 19B** — Lightricks' 19-billion-parameter open-source model. Uniquely also generates background audio. Duration is converted to `num_frames` server-side (`fps × seconds`).
- **PixVerse v5** — Strong stylistic and creative outputs. Supports anime, clay, comic, cyberpunk, and 3D animation styles. Duration is `5` or `8` seconds.

> 💡 Each model has its own pricing on fal.ai. Check each model's page before generating to avoid unexpected credit consumption.

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

This application requires a **fal.ai API key** to generate videos. The same key is used for all five supported models.

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

#### Pricing at a glance

Pricing varies by model. Always verify on the model's fal.ai page before generating at scale.

| Model | Indicative cost |
|---|---|
| **Wan 2.6** | ~$0.10 / sec at 720p ($0.05 at 480p, $0.15 at 1080p) |
| **Wan 2.2-A14B** | see [fal.ai page](https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video) |
| **Kling v2.5 Turbo Pro** | see [fal.ai page](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video) |
| **LTX-2 19B** | see [fal.ai page](https://fal.ai/models/fal-ai/ltx-2-19b/text-to-video) |
| **PixVerse v5** | see [fal.ai page](https://fal.ai/models/fal-ai/pixverse/v5/text-to-video) |

*A typical 5-second Wan 2.6 video at 720p costs ~$0.50.*

#### How much credit to buy

| Use case | Recommended starting credit |
|----------|-----------------------------|
| Personal testing / learning | **$5 – $10** |
| Regular personal use | **$20 – $50** |
| Team / production workloads | **$100+** (or contact [support@fal.ai](mailto:support@fal.ai) for enterprise pricing) |

**To add credits:**
1. Go to **[fal.ai/dashboard](https://fal.ai/dashboard)**.
2. Click **"Billing"** → **"Add credits"**.
3. Choose a credit amount and complete the payment.

> 💡 **Note:** Purchased credits expire **365 days** from the date of purchase. fal.ai only charges for **successful outputs** — HTTP 5xx server errors are never billed.

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
2. **Select a model** from the dropdown (defaults to Wan 2.6). The ↗ fal.ai link next to the dropdown opens the model's documentation page.
3. Enter a detailed prompt describing the scene you want.
4. Choose an aspect ratio, resolution, and duration. *(The available options update automatically based on the selected model.)*
5. Click **"🎬 Generate Video"**.

The job appears in the gallery below with a **Processing** badge. Generation typically takes 2–5 minutes. The page polls for updates automatically.

### Image to Video

1. Click the **"🖼️ Image to Video"** tab.
2. **Select a model** from the dropdown.
3. Provide a source image via URL or drag-and-drop upload.
4. Describe the motion you want (e.g. *"camera slowly zooms out, leaves sway gently"*).
5. Choose a duration. *(Available values are model-specific.)*
6. Click **"🎞️ Animate Image"**.

### Supported Aspect Ratios

Available options are model-specific and enforced by the fal.ai API:

| Model | Aspect ratios |
|---|---|
| Wan 2.6 | `16:9` · `4:3` · `1:1` · `3:4` · `9:16` |
| Wan 2.2-A14B | `16:9` · `4:3` · `1:1` · `3:4` · `9:16` |
| Kling v2.5 Turbo Pro | `16:9` · `9:16` · `1:1` |
| LTX-2 19B | `16:9` · `4:3` · `1:1` · `3:4` · `9:16` |
| PixVerse v5 | `16:9` · `4:3` · `1:1` · `3:4` · `9:16` |

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
