#!/usr/bin/env bash
# Usage: ./new-post.sh <slug> [title]
# Example: ./new-post.sh geoxcp "GeoXCP: Explainable Conformal Prediction"

set -e

SLUG="$1"
TITLE="${2:-$SLUG}"
DATE=$(date +%Y-%m)
FILE="posts/${SLUG}.md"

if [ -z "$SLUG" ]; then
  echo "Usage: ./new-post.sh <slug> [\"Post Title\"]"
  echo "  slug  : URL-friendly name, e.g. geo-conformal"
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

echo "✓  Created $FILE"
echo "   URL: post.html?slug=${SLUG}"
