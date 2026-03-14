#!/usr/bin/env bash
# Usage:
#   ./deploy.sh                        — auto commit message
#   ./deploy.sh "update bio"           — custom message
#   ./deploy.sh new my-slug "Title"    — create new post then deploy
#   ./deploy.sh status                 — just show git status

set -e
cd "$(dirname "$0")"

# ── Colors ──────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

# ── Subcommand: status ───────────────────────────────────────────────────
if [ "$1" = "status" ]; then
  git status
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
  echo -e "${GREEN}✓  Created $FILE${RESET}"
  echo ""
  echo -e "${YELLOW}Next steps:${RESET}"
  echo "  1. Edit posts/${SLUG}.md"
  echo "  2. Add entry to data/posts.json"
  echo "  3. Run ./deploy.sh \"add post: ${SLUG}\""
  exit 0
fi

# ── Deploy ───────────────────────────────────────────────────────────────

# Check for changes
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo -e "${YELLOW}Nothing to deploy — no changes detected.${RESET}"
  exit 0
fi

# Show what's changing
echo -e "${CYAN}Changed files:${RESET}"
git status --short
echo ""

# Commit message
if [ -n "$1" ]; then
  MSG="$1"
else
  # Auto-generate from changed files
  CHANGED=$(git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard | grep -v "^\.claude")
  FIRST=$(echo "$CHANGED" | head -1)
  COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
  if [ "$COUNT" -gt 1 ]; then
    MSG="update ${FIRST} and $((COUNT - 1)) more file(s)"
  else
    MSG="update ${FIRST}"
  fi
fi

echo -e "${CYAN}Commit message:${RESET} $MSG"
echo ""

# Stage, commit, push
git add -A -- ':!.claude'
git commit -m "$MSG"
git push

echo ""
echo -e "${GREEN}✓ Deployed!${RESET} GitHub Pages will update in ~1 minute."
echo -e "  ${CYAN}https://vezarachan.github.io${RESET}"
