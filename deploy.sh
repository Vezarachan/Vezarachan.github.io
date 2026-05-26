#!/usr/bin/env bash
# Usage:
#   ./deploy.sh                        — generate + deploy (commit & push)
#   ./deploy.sh "update bio"           — generate + deploy with custom message
#   ./deploy.sh g [message]            — generate only (commit, don't push)
#   ./deploy.sh d                      — deploy only (push existing commit)
#   ./deploy.sh new my-slug "Title"    — create new post template
#   ./deploy.sh add race               — interactively append a race
#   ./deploy.sh add talk               — interactively append a talk
#   ./deploy.sh add news               — interactively append a news item
#   ./deploy.sh add publication        — interactively append a publication
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

# ── Subcommand: add <race|talk|news|publication> ─────────────────────────
if [ "$1" = "add" ]; then
  KIND="$2"
  if [ -z "$KIND" ]; then
    echo "Usage: ./deploy.sh add <race|talk|news|publication>"
    exit 1
  fi
  python3 - "$KIND" <<'PYEOF'
import json, sys, datetime, pathlib

kind = sys.argv[1]
ROOT = pathlib.Path(__file__).parent if False else pathlib.Path('.')

def ask(label, default=None, required=False, parser=str):
    hint = f" [{default}]" if default not in (None, '') else (" *" if required else "")
    while True:
        raw = input(f"  {label}{hint}: ").strip()
        if not raw:
            if default is not None:
                return default
            if required:
                print("    (required)")
                continue
            return None
        try:
            return parser(raw)
        except Exception as e:
            print(f"    invalid: {e}")

def ask_choice(label, choices, default=None):
    return ask(f"{label} ({'/'.join(choices)})", default=default, required=True,
               parser=lambda s: s if s in choices else (_ for _ in ()).throw(ValueError(f"must be one of {choices}")))

def load(path):
    p = pathlib.Path(path)
    if not p.exists(): return []
    with p.open() as f: return json.load(f)

def save(path, data):
    with pathlib.Path(path).open('w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

def commit_entry(path, entry, head=True):
    data = load(path)
    if head:
        data.insert(0, entry)
    else:
        data.append(entry)
    save(path, data)
    print(f"\n✓  Appended to {path}")
    print(json.dumps(entry, indent=2, ensure_ascii=False))

print(f"\n→ Add {kind} entry  (blank to accept default; Ctrl-C to abort)\n")

if kind == 'race':
    today = datetime.date.today().isoformat()
    entry = {
        'date':      ask('date (YYYY-MM-DD)', default=today, required=True),
        'name':      ask('name (full race name)', required=True),
        'short':     ask('short label (e.g. "Lavaredo 50K")', required=True),
        'country':   ask('country code (ITA/SUI/AUT/FRA/ESP/SLO/GER…)', required=True),
        'flag':      ask('flag emoji', required=True),
        'category':  ask('category (50K / 50M / 100K / 100M / Half Marathon)', required=True),
        'distance':  ask('distance (e.g. "86 km")', required=True),
        'elevation': ask('elevation (e.g. "5500 m+")', required=True),
        'time':      ask('finish time (HH:MM:SS or DNF; blank if upcoming)'),
        'score':     ask('ITRA score (int or blank)', parser=lambda s: int(s)),
        'lat':       ask('latitude (float)', required=True, parser=float),
        'lng':       ask('longitude (float)', required=True, parser=float),
    }
    status = ask_choice('status', ['finished', 'dnf', 'upcoming'],
                        default='upcoming' if entry['time'] is None else ('dnf' if entry['time'] == 'DNF' else 'finished'))
    if status == 'upcoming':
        entry['status'] = 'upcoming'
    commit_entry('data/races.json', entry, head=True)

elif kind == 'talk':
    entry = {
        'title':         ask('title', required=True),
        'event':         ask('event (conference/symposium name)', required=True),
        'event_url':     ask('event_url (conference homepage, optional)'),
        'location':      ask('location (e.g. "Ghent, Belgium")'),
        'year':          ask('year', required=True, parser=int),
        'date':          ask('date (free text, e.g. "Jun 2026")', required=True),
        'type':          ask('type (invited / oral / poster / keynote)', required=True),
        'topic':         ask('topic tag', required=True),
        'abstract':      ask('abstract', required=True),
        'related_paper': ask('related_paper (exact title from publications.json, or blank)'),
        'slides':        ask('slides URL', default=''),
        'video':         ask('video URL', default=''),
    }
    entry = {k: v for k, v in entry.items() if v is not None}
    commit_entry('data/talks.json', entry, head=True)

elif kind == 'news':
    entry = {
        'date':      ask('date (e.g. "May 2026")', required=True),
        'content':   ask('content (text before the link)', required=True),
        'link_text': ask('link_text (the linked title)', required=True),
        'link_url':  ask('link_url', default='#'),
        'suffix':    ask('suffix (text after the link)', default=''),
    }
    commit_entry('data/news.json', entry, head=True)

elif kind == 'publication':
    entry = {
        'year':     ask('year', required=True, parser=int),
        'type':     ask_choice('type', ['journal', 'conference', 'under-review', 'technical-report']),
        'featured': ask('featured? (y/n)', default='n', parser=lambda s: s.lower().startswith('y')),
        'title':    ask('title', required=True),
        'authors':  ask('authors (comma-separated, bold yourself with **)', required=True),
        'venue':    ask('venue', required=True),
        'tags':     ask('tags (comma-separated)', default='',
                        parser=lambda s: [t.strip() for t in s.split(',') if t.strip()]),
        'url':      ask('url', default=''),
        'pdf':      ask('pdf URL', default=''),
        'code':     ask('code URL', default=''),
        'demo':     ask('demo URL (optional)', default=''),
    }
    if not entry['demo']:
        entry.pop('demo')
    commit_entry('data/publications.json', entry, head=True)

else:
    print(f"Unknown kind: {kind}")
    print("Supported: race, talk, news, publication")
    sys.exit(1)
PYEOF
  echo ""
  echo -e "${YELLOW}Next:${RESET} ${CYAN}./deploy.sh${RESET}   # generate + deploy"
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
