#!/usr/bin/env bash
# Usage:
#   ./deploy.sh                        — generate + deploy (commit & push)
#   ./deploy.sh "update bio"           — generate + deploy with custom message
#   ./deploy.sh g [message]            — generate only (commit, don't push)
#   ./deploy.sh d                      — deploy only (push existing commit)
#   ./deploy.sh new my-slug "Title"    — create new post template
#   ./deploy.sh status                 — show git status

set -e
cd "$(dirname "$0")"

# ── Colors ───────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

# ── Subcommand: status ───────────────────────────────────────────────────
if [ "$1" = "status" ]; then
  git status
  exit 0
fi

# ── Subcommand: deploy only (push) ───────────────────────────────────────
if [ "$1" = "d" ] || [ "$1" = "deploy" ]; then
  if git diff --quiet HEAD @{u} 2>/dev/null; then
    echo -e "${YELLOW}Nothing to deploy — already up to date with remote.${RESET}"
    exit 0
  fi
  echo -e "${CYAN}Pushing to GitHub...${RESET}"
  git push
  echo ""
  echo -e "${GREEN}✓ Deployed!${RESET} GitHub Pages will update in ~1 minute."
  echo -e "  ${CYAN}https://vezarachan.github.io${RESET}"
  exit 0
fi

# ── Subcommand: new <slug> [title] ───────────────────────────────────────
if [ "$1" = "new" ]; then
  SLUG="$2"
  TITLE="${3:-$SLUG}"
  DATE=$(date +%Y-%m)
  FILE="posts/${SLUG}.md"
  if [ -z "$SLUG" ]; then
    echo "Usage: ./deploy.sh new <slug> [\"Title\"]"
    exit 1
  fi
  if [ -f "$FILE" ]; then
    echo "Error: $FILE already exists."
    exit 1
  fi
  mkdir -p posts
  cat > "$FILE" << EOF
---
title: ${TITLE}
date: ${DATE}
tags: []
subtitle:
---

## Motivation

...

## Method

...

## Results

...
EOF
  # Auto-append entry to data/posts.json
  python3 - <<PYEOF
import json, sys
path = 'data/posts.json'
with open(path) as f:
    posts = json.load(f)
# Don't add duplicate
if not any(p.get('slug') == '${SLUG}' for p in posts):
    posts.insert(0, {
        "slug": "${SLUG}",
        "title": "${TITLE}",
        "date": "${DATE}",
        "tags": [],
        "subtitle": "",
        "related_paper": "",
        "related_research": ""
    })
    with open(path, 'w') as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print("✓  Added to data/posts.json")
else:
    print("⚠  Slug already in data/posts.json, skipped")
PYEOF

  echo -e "${GREEN}✓  Created $FILE${RESET}"
  echo ""
  echo -e "${YELLOW}Next steps:${RESET}"
  echo "  1. Edit posts/${SLUG}.md"
  echo "  2. Fill in data/posts.json (tags, subtitle, related_paper…)"
  echo "  3. Run ./deploy.sh g \"add post: ${SLUG}\"   # commit"
  echo "     ./deploy.sh d                            # push"
  exit 0
fi

# ── Generate (commit) ────────────────────────────────────────────────────
do_generate() {
  local MSG="$1"

  # Check for changes
  if git diff --quiet && git diff --cached --quiet && \
     [ -z "$(git ls-files --others --exclude-standard | grep -v '^\.claude')" ]; then
    echo -e "${YELLOW}Nothing to commit — no changes detected.${RESET}"
    exit 0
  fi

  # Show what's changing
  echo -e "${CYAN}Changed files:${RESET}"
  git status --short
  echo ""

  # Auto-generate message if not provided
  if [ -z "$MSG" ]; then
    CHANGED=$(git diff --name-only; git diff --cached --name-only; \
              git ls-files --others --exclude-standard | grep -v "^\.claude")
    FIRST=$(echo "$CHANGED" | head -1)
    COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
    if [ "$COUNT" -gt 1 ]; then
      MSG="update ${FIRST} and $((COUNT - 1)) more file(s)"
    else
      MSG="update ${FIRST}"
    fi
  fi

  # Auto-bump cache-buster version in HTML files using timestamp
  STAMP=$(date +%s)
  sed -i '' "s/main\.js?v=[^\"&']*/main.js?v=${STAMP}/g"   index.html
  sed -i '' "s/post\.js?v=[^\"&']*/post.js?v=${STAMP}/g"   post.html

  echo -e "${CYAN}Commit message:${RESET} $MSG"
  echo ""

  git add -A -- ':!.claude'
  git commit -m "$MSG"
  echo -e "${GREEN}✓ Generated!${RESET} Run ${CYAN}./deploy.sh d${RESET} to push."
}

# ── Subcommand: generate only ────────────────────────────────────────────
if [ "$1" = "g" ] || [ "$1" = "generate" ]; then
  do_generate "$2"
  exit 0
fi

# ── Default: generate + deploy ───────────────────────────────────────────
do_generate "$1"
git push
echo ""
echo -e "${GREEN}✓ Deployed!${RESET} GitHub Pages will update in ~1 minute."
echo -e "  ${CYAN}https://vezarachan.github.io${RESET}"
