#!/usr/bin/env bash
# =============================================================================
# Wan 2.6 Studio — Application Management Script
# =============================================================================
# Usage:
#   ./run.sh start   — Build (if needed) and start all services
#   ./run.sh stop    — Stop and remove all containers
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }

# ── OS detection ──────────────────────────────────────────────────────────────
OS="$(uname -s)"

# ── Preflight checks ───────────────────────────────────────────────────────────
check_dependencies() {
    if ! command -v docker >/dev/null 2>&1; then
        case "$OS" in
            Darwin) error "Docker is not installed. Install Docker Desktop from https://docs.docker.com/desktop/mac/" ;;
            *)      error "Docker is not installed. Run: curl -fsSL https://get.docker.com | sh" ;;
        esac
    fi
    docker compose version >/dev/null 2>&1 || \
        error "Docker Compose v2 is required. Update Docker Desktop (Mac) or run: apt install docker-compose-plugin"
}

check_env_file() {
    if [[ ! -f ".env" ]]; then
        warn ".env file not found. Copying from .env.example ..."
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            warn "Please edit .env and set your FAL_API_KEY, then re-run this script."
            exit 1
        else
            error ".env.example not found. Cannot continue."
        fi
    fi

    # Validate FAL_API_KEY is set (grep || true so it never fails on no-match)
    local fal_key
    fal_key=$(grep -E '^FAL_API_KEY=' .env 2>/dev/null || true)
    fal_key=$(echo "$fal_key" | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs 2>/dev/null || true)
    if [[ -z "$fal_key" || "$fal_key" == "your_fal_api_key_here" ]]; then
        error "FAL_API_KEY is not set in .env. Please add your key from https://fal.ai/dashboard/keys"
    fi
}

# ── Browser helper ─────────────────────────────────────────────────────────────
open_browser() {
    local url="$1"
    case "$OS" in
        Darwin)  open "$url" ;;                        # macOS
        Linux)   xdg-open "$url" >/dev/null 2>&1 & ;; # Ubuntu / any Linux
        MINGW*|CYGWIN*|MSYS*) start "$url" ;;         # Git Bash on Windows
        *)       warn "Cannot open browser automatically. Visit: $url" ;;
    esac
}

wait_for_app() {
    local url="$1"
    local retries=60   # 60 × 3s = up to 3 minutes
    local count=0

    info "Waiting for the application to be ready..."
    while (( count < retries )); do
        if curl -sf "$url" -o /dev/null 2>/dev/null; then
            return 0
        fi
        sleep 3
        (( count++ ))
    done
    return 1
}

# ── Commands ───────────────────────────────────────────────────────────────────
cmd_start() {
    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}║       Wan 2.6 Studio — Starting...       ║${RESET}"
    echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
    echo ""

    check_dependencies
    check_env_file

    info "Stopping any existing containers (cleanup)..."
    docker compose down --remove-orphans 2>/dev/null || true
    echo ""

    info "Building Docker images (this may take a few minutes on first run)..."
    docker compose build

    info "Starting all services..."
    docker compose up -d

    echo ""
    # Wait until backend is healthy, then open the browser
    local app_url="http://localhost:3000"
    local health_url="http://localhost:8080/api/actuator/health"

    if wait_for_app "$health_url"; then
        success "Application is ready!"
        echo ""
        echo -e "  ${BOLD}Frontend:${RESET}  ${CYAN}${app_url}${RESET}"
        echo -e "  ${BOLD}Backend:${RESET}   ${CYAN}${health_url}${RESET}"
        echo ""
        open_browser "$app_url"
    else
        warn "Application did not become healthy within 2 minutes."
        warn "Check the logs with: docker compose logs"
    fi


    info "Showing live logs (Ctrl+C to detach — containers keep running)..."
    # Trap Ctrl+C so it only exits the log-follow, not the containers.
    trap '' INT
    docker compose logs -f || true
    trap - INT
    echo ""
    success "Detached from logs. Containers are still running."
    echo -e "  Run ${YELLOW}./run.sh stop${RESET} to shut everything down."
    echo ""
}

cmd_stop() {
    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}║       Wan 2.6 Studio — Stopping...       ║${RESET}"
    echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
    echo ""

    check_dependencies

    info "Stopping all containers..."
    docker compose down

    success "All containers stopped."
    echo ""
}

# ── Main ───────────────────────────────────────────────────────────────────────
case "${1:-}" in
    start)  cmd_start ;;
    stop)   cmd_stop  ;;
    *)
        echo ""
        echo -e "${BOLD}Wan 2.6 Studio — Management Script${RESET}"
        echo ""
        echo -e "  Usage:  ${CYAN}./run.sh${RESET} ${YELLOW}<command>${RESET}"
        echo ""
        echo -e "  Commands:"
        echo -e "    ${YELLOW}start${RESET}   Build images and start all services"
        echo -e "    ${YELLOW}stop${RESET}    Stop and remove all containers"
        echo ""
        exit 1
        ;;
esac
