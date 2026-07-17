#!/usr/bin/env bash
# ============================================================================
#  rally-ship.sh — Portal export  →  live GitHub Pages site, in one command.
#
#  Takes the four files the Rally-ORG Builder Portal exports
#  (org.config.json, theme.tokens.json, intake.json, <slug>-logo.png),
#  drops them into a clean copy of the engine, names a new repo from the org,
#  creates it, pushes, turns Pages on (Actions build), and waits for the
#  deploy — surfacing the live URL.
#
#  USAGE
#    rally-ship.sh --from ~/Downloads
#    rally-ship.sh --from ./exports --repo texas-venom --owner jeremiah9980
#    rally-ship.sh --from ~/Downloads --dry-run        # assemble only, no GitHub
#
#  FLAGS
#    --from   DIR    folder holding the portal exports        (default: .)
#    --repo   NAME   repo name override            (default: slug of org name)
#    --owner  LOGIN  GitHub owner            (default: your authenticated login)
#    --engine PATH   path to the rally-org-builder engine
#                    (default: this script's repo; else clones it)
#    --dashboard-repo O/R  after deploy, register the site in O/R's registry.json
#                    (or set env RALLY_DASHBOARD_REPO) so the dashboard self-populates
#    --private       create the repo private (Pages needs a paid plan)
#    --strict        abort if the config validator reports any error
#    --no-watch      don't block waiting for the deploy to finish
#    --yes           skip the confirmation prompt
#    --dry-run       build the site locally and stop (no repo, no push)
#    -h, --help      show this help
#
#  REQUIREMENTS:  git, gh (run `gh auth login` once). node is used if present.
# ============================================================================
set -Eeuo pipefail

# ---- defaults -------------------------------------------------------------
FROM="."; REPO=""; OWNER=""; ENGINE=""; VISIBILITY="--public"
STRICT=0; WATCH=1; ASSUME_YES=0; DRY_RUN=0
DASH_REPO="${RALLY_DASHBOARD_REPO:-}"
ENGINE_REPO="jeremiah9980/rally-org-builder"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
TMPDIRS=()

# ---- logging --------------------------------------------------------------
if [ -t 1 ]; then B=$'\033[1m'; D=$'\033[2m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; C=$'\033[36m'; X=$'\033[0m'; else B=""; D=""; G=""; Y=""; R=""; C=""; X=""; fi
info(){ printf '%s→%s %s\n' "$C" "$X" "$*"; }
ok(){   printf '%s✔%s %s\n' "$G" "$X" "$*"; }
warn(){ printf '%s⚠%s %s\n' "$Y" "$X" "$*" >&2; }
die(){  printf '%s✘ %s%s\n' "$R" "$*" "$X" >&2; exit 1; }
step(){ printf '\n%s%s%s\n' "$B" "$*" "$X"; }
cleanup(){ for d in "${TMPDIRS[@]:-}"; do [ -n "$d" ] && [ -d "$d" ] && rm -rf "$d"; done; }
trap cleanup EXIT
trap 'die "failed on line $LINENO"' ERR

usage(){ sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

# ---- args -----------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --from) FROM="${2:?}"; shift 2;;
    --repo) REPO="${2:?}"; shift 2;;
    --owner) OWNER="${2:?}"; shift 2;;
    --engine) ENGINE="${2:?}"; shift 2;;
    --dashboard-repo) DASH_REPO="${2:?}"; shift 2;;
    --private) VISIBILITY="--private"; shift;;
    --strict) STRICT=1; shift;;
    --no-watch) WATCH=0; shift;;
    --yes|-y) ASSUME_YES=1; shift;;
    --dry-run) DRY_RUN=1; shift;;
    -h|--help) usage;;
    *) die "unknown flag: $1  (try --help)";;
  esac
done

# ---- preflight ------------------------------------------------------------
step "Preflight"
command -v git >/dev/null || die "git not found."
HAVE_NODE=0; command -v node >/dev/null && HAVE_NODE=1
if [ "$DRY_RUN" -eq 0 ]; then
  command -v gh >/dev/null || die "gh (GitHub CLI) not found. Install it, then: gh auth login"
  gh auth status >/dev/null 2>&1 || die "gh is not authenticated. Run: gh auth login"
  ok "gh authenticated as $(gh api user -q .login 2>/dev/null || echo '?')"
fi
[ "$HAVE_NODE" -eq 1 ] && ok "node present (will parse name + validate)" || warn "node not found — using shell fallbacks; validation skipped."

# ---- locate portal exports ------------------------------------------------
step "Reading portal exports from: $FROM"
[ -d "$FROM" ] || die "--from dir not found: $FROM"
CFG="$FROM/org.config.json"; TOK="$FROM/theme.tokens.json"; INTAKE="$FROM/intake.json"
[ -f "$CFG" ] || die "missing org.config.json in $FROM"
[ -f "$TOK" ] || die "missing theme.tokens.json in $FROM"
[ -f "$INTAKE" ] || warn "no intake.json in $FROM (kept for provenance only — continuing)."
# logo: the portal exports <slug>-logo.png; accept any *-logo.png / logo.png
LOGO="$(ls "$FROM"/*-logo.png "$FROM"/logo.png 2>/dev/null | head -1 || true)"
[ -n "$LOGO" ] && ok "logo: $(basename "$LOGO")" || warn "no logo found in $FROM (site will use a wordmark fallback)."

# validate JSON early so we fail before touching GitHub
if [ "$HAVE_NODE" -eq 1 ]; then
  node -e "JSON.parse(require('fs').readFileSync('$CFG','utf8'))" 2>/dev/null || die "org.config.json is not valid JSON."
  node -e "JSON.parse(require('fs').readFileSync('$TOK','utf8'))" 2>/dev/null || die "theme.tokens.json is not valid JSON."
fi

# ---- derive org name -> slug -> repo --------------------------------------
slugify(){ printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'; }
if [ "$HAVE_NODE" -eq 1 ]; then
  ORG_NAME="$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).organization.name||''))" "$CFG" 2>/dev/null || echo '')"
else
  ORG_NAME="$(grep -o '"name"[^,]*' "$CFG" | head -1 | sed -E 's/.*"name"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
fi
[ -n "$ORG_NAME" ] || die "could not read organization.name from org.config.json (pass --repo to override)."
SLUG="$(slugify "$ORG_NAME")"
[ -n "$REPO" ] || REPO="$SLUG"
if [ "$DRY_RUN" -eq 0 ]; then [ -n "$OWNER" ] || OWNER="$(gh api user -q .login)"; else OWNER="${OWNER:-OWNER}"; fi
ok "org \"$ORG_NAME\"  →  repo ${B}${OWNER}/${REPO}${X}"

# ---- resolve the engine (index.html + src/ + public/) ---------------------
step "Resolving engine"
engine_ok(){ [ -f "$1/index.html" ] && [ -d "$1/src" ] && [ -d "$1/public" ]; }
if [ -z "$ENGINE" ]; then
  if engine_ok "$SCRIPT_DIR/.."; then ENGINE="$(cd "$SCRIPT_DIR/.." && pwd)";
  elif engine_ok "$SCRIPT_DIR"; then ENGINE="$SCRIPT_DIR";
  elif engine_ok "."; then ENGINE="$(pwd)";
  else
    info "engine not found locally — cloning $ENGINE_REPO …"
    ETMP="$(mktemp -d)"; TMPDIRS+=("$ETMP")
    git clone --depth 1 "https://github.com/${ENGINE_REPO}.git" "$ETMP/engine" >/dev/null 2>&1 || die "could not clone engine."
    ENGINE="$ETMP/engine"
  fi
fi
engine_ok "$ENGINE" || die "engine at '$ENGINE' is missing index.html/src/public."
ok "engine: $ENGINE"

# ---- assemble the deployable site -----------------------------------------
step "Assembling site for $REPO"
BUILD="$(mktemp -d)"; TMPDIRS+=("$BUILD")
cp "$ENGINE/index.html" "$BUILD/"
cp -R "$ENGINE/src" "$ENGINE/public" "$BUILD/"
# strip logos/junk carried from the engine template; each repo ships only its own logo
find "$BUILD/public/images/logos" -type f ! -iname 'README*' -delete 2>/dev/null || true
mkdir -p "$BUILD/src/config" "$BUILD/public/images/logos" "$BUILD/.github/workflows"

# overlay portal configs (identity + content)
cp "$TOK" "$BUILD/src/config/theme.tokens.json"
cp "$CFG" "$BUILD/src/config/org.config.json"
[ -f "$INTAKE" ] && cp "$INTAKE" "$BUILD/intake.json"   # provenance / re-generation

# logo → public/images/logos/, and point branding.logo at the real file
if [ -n "$LOGO" ]; then
  LOGO_BASE="$(basename "$LOGO")"
  cp "$LOGO" "$BUILD/public/images/logos/$LOGO_BASE"
  if [ "$HAVE_NODE" -eq 1 ]; then
    node -e '
      const fs=require("fs"), p=process.argv[1], base=process.argv[2];
      const c=JSON.parse(fs.readFileSync(p,"utf8"));
      c.branding=c.branding||{}; c.branding.logo="/images/logos/"+base; c.branding.logoFallbackWordmark=false;
      fs.writeFileSync(p, JSON.stringify(c,null,2)+"\n");
    ' "$BUILD/src/config/org.config.json" "$LOGO_BASE"
  fi
  ok "logo wired → /images/logos/$LOGO_BASE"
fi

# the deploy mechanism, carried by the script itself (no template dependency)
printf '' > "$BUILD/.nojekyll"
cat > "$BUILD/.github/workflows/deploy.yml" <<'YML'
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
YML

# a minimal repo README so the GitHub repo page isn't empty
cat > "$BUILD/README.md" <<MD
# ${ORG_NAME}

Governance-grade org site built with the Rally-ORG Builder Kit and shipped by \`rally-ship.sh\`.

- Live: https://${OWNER}.github.io/${REPO}/
- Identity + content come from \`src/config/theme.tokens.json\` and \`src/config/org.config.json\`.
- Re-deploy: re-run the portal, then \`rally-ship.sh --from <exports> --repo ${REPO}\`.
MD
ok "assembled in $BUILD"

# ---- validate (soft unless --strict) --------------------------------------
if [ "$HAVE_NODE" -eq 1 ] && [ -f "$ENGINE/scripts/validate-config.js" ]; then
  step "Validating config"
  mkdir -p "$BUILD/scripts"; cp "$ENGINE/scripts/validate-config.js" "$BUILD/scripts/"
  if (cd "$BUILD" && node scripts/validate-config.js); then ok "validation passed"
  else
    rc=$?
    [ "$STRICT" -eq 1 ] && die "validation reported errors (--strict). Fix the config and re-run."
    warn "validator returned non-zero (rc=$rc) — continuing (use --strict to block)."
  fi
  rm -rf "$BUILD/scripts"
fi

# ---- dry-run stops here ---------------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  PERSIST="./rally-build-$REPO"; rm -rf "$PERSIST"; cp -R "$BUILD" "$PERSIST"
  step "Dry run complete"
  ok "site assembled at: $PERSIST"
  info "tree:"; ( cd "$PERSIST" && find . -type f -not -path './.git/*' | sed 's|^\./||' | sort | sed 's/^/    /' )
  info "Would create & deploy: ${OWNER}/${REPO}  →  https://${OWNER}.github.io/${REPO}/"
  exit 0
fi

# ---- confirm --------------------------------------------------------------
if [ "$ASSUME_YES" -eq 0 ]; then
  printf '\n%sCreate/deploy %s (%s) ?%s [y/N] ' "$B" "${OWNER}/${REPO}" "${VISIBILITY#--}" "$X"
  read -r ans; case "$ans" in y|Y|yes|YES) ;; *) die "aborted.";; esac
fi

# ---- create (or reuse) the repo + push ------------------------------------
step "Publishing to ${OWNER}/${REPO}"
cd "$BUILD"
git init -q; git checkout -q -b main 2>/dev/null || git branch -q -M main
git add -A; git -c user.email=rally@local -c user.name=rally commit -qm "Deploy ${ORG_NAME} via rally-ship" || true

if gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
  warn "repo exists — updating it (force push)."
  git remote add origin "https://github.com/${OWNER}/${REPO}.git" 2>/dev/null || git remote set-url origin "https://github.com/${OWNER}/${REPO}.git"
  git push -u origin main --force
else
  gh repo create "${OWNER}/${REPO}" $VISIBILITY --source=. --remote=origin --push
  ok "repo created"
fi

# ---- enable Pages (build via the committed Actions workflow) --------------
step "Enabling GitHub Pages (Actions build)"
if gh api "repos/${OWNER}/${REPO}/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/${OWNER}/${REPO}/pages" -f build_type=workflow >/dev/null && ok "Pages set to workflow build"
else
  gh api -X POST "repos/${OWNER}/${REPO}/pages" -f build_type=workflow >/dev/null && ok "Pages enabled (workflow build)"
fi
# make sure a run is in flight even if the push didn't auto-trigger
gh workflow run deploy.yml -R "${OWNER}/${REPO}" >/dev/null 2>&1 || true

URL="https://${OWNER}.github.io/${REPO}/"

# ---- register in the dashboard registry (optional) ------------------------
if [ -n "$DASH_REPO" ]; then
  step "Registering in dashboard registry: $DASH_REPO"
  REG_TMP="$(mktemp)"; TMPDIRS+=("$REG_TMP")
  SHA=""
  if RESP="$(gh api "repos/${DASH_REPO}/contents/registry.json" 2>/dev/null)"; then
    SHA="$(printf '%s' "$RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{process.stdout.write(JSON.parse(s).sha||'')}catch{}})")"
    printf '%s' "$RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(Buffer.from(j.content||'',j.encoding||'base64').toString('utf8'))}catch{process.stdout.write('')}})" > "$REG_TMP" || true
  fi
  ENTRY="$(node -e "process.stdout.write(JSON.stringify({repo:process.argv[1],org:process.argv[2],url:process.argv[3],deployed_at:new Date().toISOString()}))" "${OWNER}/${REPO}" "$ORG_NAME" "$URL")"
  node -e '
    const fs=require("fs"); const [p,e]=process.argv.slice(1);
    let reg={repos:[]};
    try{const raw=fs.readFileSync(p,"utf8"); if(raw.trim()){const j=JSON.parse(raw); reg=Array.isArray(j)?{repos:j}:(j&&j.repos?j:{repos:[]});}}catch{}
    reg.repos=(reg.repos||[]).map(r=>typeof r==="string"?{repo:r}:r);
    const entry=JSON.parse(e);
    reg.repos=reg.repos.filter(r=>r.repo!==entry.repo); reg.repos.push(entry);
    reg.updated=new Date().toISOString();
    fs.writeFileSync(p, JSON.stringify(reg,null,2)+"\n");
  ' "$REG_TMP" "$ENTRY"
  B64="$(base64 -w0 "$REG_TMP" 2>/dev/null || base64 "$REG_TMP" | tr -d '\n')"
  if [ -n "$SHA" ]; then
    gh api -X PUT "repos/${DASH_REPO}/contents/registry.json" -f message="register ${OWNER}/${REPO}" -f content="$B64" -f sha="$SHA" >/dev/null && ok "updated ${DASH_REPO}/registry.json"
  else
    gh api -X PUT "repos/${DASH_REPO}/contents/registry.json" -f message="register ${OWNER}/${REPO}" -f content="$B64" >/dev/null && ok "created ${DASH_REPO}/registry.json"
  fi
fi
# ---- watch ----------------------------------------------------------------
if [ "$WATCH" -eq 1 ]; then
  step "Watching deploy (Ctrl-C to stop; deploy continues server-side)"
  sleep 4
  RID="$(gh run list -R "${OWNER}/${REPO}" --workflow=deploy.yml -L1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)"
  [ -n "$RID" ] && gh run watch "$RID" -R "${OWNER}/${REPO}" --exit-status || warn "couldn't attach to the run; check the Actions tab."
fi

step "Done"
ok "Live (allow ~1–2 min on first deploy):  ${B}${URL}${X}"
info "Status any time:        gh run list -R ${OWNER}/${REPO} --workflow=deploy.yml"
