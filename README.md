# 📖 Bible Study Tool — AI-Powered Scripture Research Platform

An open-source, AI-powered Bible study platform built with **Next.js 16**, **Vercel AI SDK v6**, and **Neon Postgres**. This application provides an interactive environment for deep Scripture study with intelligent tools that connect the Bible text, Greek/Hebrew word study, and theological dictionaries — all powered by multi-provider AI through the Vercel AI Gateway.

> *"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."* — 2 Timothy 2:15 (KJV)

---

## ✨ Features

### 📚 Bible Reader
- **King James Version (KJV)** — complete 66-book canon, verse-by-verse
- Parallel translation support (infrastructure ready)
- Chapter navigation with book/chapter index
- Inline **Strong's Concordance tags** on KJV text for original-language word study
- Verse bookmarking with personal notes

### 🤖 AI Study Agent
- Conversational AI assistant for theological study
- **Multi-provider support** via Vercel AI Gateway — choose from:
  - Anthropic (Claude Opus 4.6, Sonnet, Haiku)
  - Google (Gemini 3.1 Pro, Gemini 3 Flash)
  - OpenAI (GPT-5 Mini, GPT-5 Nano)
  - xAI (Grok 4.20)
  - Meta (Llama 4 Maverick)
- **10-step tool calling** — the AI can look up verses, Strong's numbers, and dictionary definitions in a single response
- **Interactive inline tooltips** — hover (desktop) or tap (mobile) any citation to see:
  - 📖 **Verse popups** — actual KJV text without leaving the page
  - 🔤 **Strong's popups** — original word, transliteration, pronunciation, definition
  - 📚 **Dictionary popups** — Easton's Bible Dictionary definitions

### 🔤 Strong's Concordance
- **14,288 entries** — complete Hebrew (H1–H8674) and Greek (G1–G5624)
- Search by **Strong's number** (H430, G25) or **English word** (love, grace, covenant)
- Direct deep-links from AI chat responses
- Original word, transliteration, pronunciation, and full definition

### 📚 Bible Dictionaries
- **Easton's Bible Dictionary** — 3,964 entries covering people, places, doctrines, and customs
- **Webster's 1828 Dictionary** — ~61,000 entries (Noah Webster's original American English dictionary with biblical definitions)
- Full-text search across all entries

### 📖 Theological Library
- Public domain Christian classics:
  - **Charles Spurgeon** — *Morning & Evening*, *Faith's Checkbook*, *The Treasury of David*, *All of Grace*, *Lectures to My Students*, Spurgeon's Catechism, and more
  - Additional works from the [Prince of Preachers archive](https://www.princeofpreachers.org/books.html)
- Chapter-by-chapter reader with sermon and devotional formats
- Daily devotional system with date-based entries

### ✍️ Study Notes
- Google Keep-style notes with rich text editing (TipTap)
- Folder organization with color coding
- Pin important notes
- Link notes to specific Bible passages

### 🔍 Full-Text Search
- Search across the entire Bible, dictionaries, and Strong's concordance
- Fast Postgres full-text search with `tsvector` indexing

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **AI** | Vercel AI SDK v6, AI Gateway, Workflow DevKit |
| **Database** | Neon Postgres (serverless) with pgvector |
| **Auth** | JWT sessions with bcrypt (jose) |
| **Styling** | Tailwind CSS v4, Shadcn UI |
| **Editor** | TipTap (rich text notes) |
| **Streaming** | Streamdown (AI response rendering) |
| **Rate Limiting** | Upstash Redis |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (or 24)
- A [Neon](https://neon.tech) Postgres database
- A [Vercel AI Gateway](https://sdk.vercel.ai/docs/ai-sdk-gateway) key (or individual provider API keys)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/bible-study.git
cd bible-study
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Neon Postgres
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require

# AI Gateway (Vercel)
AI_GATEWAY_BASE_URL=https://gateway.ai.cloudflare.com/v1/...
# Or individual provider keys:
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...

# Auth
JWT_SECRET=your-random-secret-at-least-32-chars

# Email (optional — password reset)
RESEND_API_KEY=re_...

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 4. Initialize the Database

Run the schema against your Neon database:

```bash
# Option 1: Via Neon console — paste scripts/schema.sql
# Option 2: Via psql
psql $DATABASE_URL -f scripts/schema.sql
```

### 5. Seed the Data

```bash
# Seed Bible text (KJV)
npx tsx scripts/seed-bibles.ts

# Seed Strong's Concordance (H + G entries)
npx tsx scripts/seed-strongs.ts

# Seed Easton's Bible Dictionary (from GitHub JSON)
node scripts/import-easton.mjs

# Seed Webster's 1828 Dictionary
node scripts/import-webster-1828.mjs

# Seed Library (Spurgeon, theological works)
npx tsx scripts/seed-library.ts
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
bible-study/
├── app/
│   ├── (app)/              # Authenticated pages
│   │   ├── bible/          # Bible reader
│   │   ├── dashboard/      # Home dashboard
│   │   ├── devotional/     # Daily devotionals
│   │   ├── dictionary/     # Bible dictionary browser
│   │   ├── library/        # Theological library reader
│   │   ├── notes/          # Study notes editor
│   │   ├── search/         # Full-text search
│   │   ├── strongs/        # Strong's concordance lookup
│   │   └── study/          # AI study agent
│   ├── api/                # API routes (REST)
│   │   ├── bible/          # Bible text endpoints
│   │   ├── chat/           # AI chat streaming endpoint
│   │   ├── dictionary/     # Dictionary lookup
│   │   ├── notes/          # CRUD for notes & folders
│   │   ├── search/         # Full-text search
│   │   └── strongs/        # Strong's lookup + English search
│   └── globals.css         # Design tokens & theme
├── components/
│   ├── ui/                 # Shared UI components (SmartTooltip, etc.)
│   ├── chat.tsx            # AI chat interface
│   ├── citation-tooltip.tsx
│   ├── strongs-tooltip.tsx
│   ├── dictionary-tooltip.tsx
│   └── ...
├── lib/
│   ├── ai-tools.ts         # AI agent tool definitions
│   ├── bible-books.ts      # Book metadata (66 books)
│   ├── citation-parser.ts  # Parse [Genesis 1:1], [H430], [dict:Covenant]
│   ├── constants.ts        # AI model configuration
│   ├── db.ts               # Neon DB client
│   ├── gateway.ts          # Vercel AI Gateway provider
│   └── remark-citations.ts # Remark plugin for markdown citations
├── scripts/                # Database seed & migration scripts
│   ├── schema.sql          # Full database schema
│   ├── seed-bibles.ts      # KJV importer
│   ├── seed-strongs.ts     # Strong's Concordance importer
│   ├── import-easton.mjs   # Easton's Dictionary importer
│   └── seed-library.ts     # Library books seeder
└── types/                  # TypeScript type definitions
```

---

## 📜 Data Sources & Attribution

All Scripture text, reference works, and theological publications used in this project are in the **public domain** (published before 1928 or explicitly released).

| Resource | Source | Status |
|----------|--------|--------|
| **King James Version (1769)** | Public domain | ✅ Free |
| **Strong's Exhaustive Concordance** (James Strong, 1890) | Public domain | ✅ Free |
| **Easton's Bible Dictionary** (Matthew Easton, 1897) | [GitHub: solancer/bible-dictionary-scraper](https://github.com/solancer/bible-dictionary-scraper) | ✅ Free |
| **Webster's 1828 Dictionary** (Noah Webster) | [GitHub: Wikipedia archives](https://github.com/wikipedia-archives) | ✅ Free |
| **Charles Spurgeon's Works** (1834–1892) | [princeofpreachers.org](https://www.princeofpreachers.org/books.html) | ✅ Free / Public Domain |
| **Spurgeon's Catechism** | [princeofpreachers.org/catechism](https://www.princeofpreachers.org/catechism.html) | ✅ Free / Public Domain |
| **Morning & Evening Devotional** | [princeofpreachers.org](https://www.princeofpreachers.org/morning-and-evening.html) | ✅ Free / Public Domain |
| **Faith's Checkbook** | [princeofpreachers.org](https://www.princeofpreachers.org/faiths-checkbook.html) | ✅ Free / Public Domain |
| **Gleanings Among the Sheaves** | [princeofpreachers.org](https://www.princeofpreachers.org/gleanings.html) | ✅ Free / Public Domain |

> **Special thanks** to [princeofpreachers.org](https://www.princeofpreachers.org/) for their faithful preservation and free distribution of Charles Spurgeon's complete works — sermons, devotionals, books, prayers, and catechism. All of Spurgeon's works are public domain.

---

## 🤝 Contributing

Contributions are welcome! This project exists to make deep Bible study accessible to everyone.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/verse-highlights`)
3. Commit your changes (`git commit -m 'Add verse highlighting'`)
4. Push to the branch (`git push origin feature/verse-highlights`)
5. Open a Pull Request

### Ideas for contribution:
- Additional Bible translations (ASV, WEB, etc.)
- More dictionary sources
- Sermon outlines and commentaries
- Reading plans
- Cross-reference database
- Audio Bible integration
- Mobile apps (React Native)

---

## 📋 License

See [PUBLICATION.md](./PUBLICATION.md) for the full free publication notice.

**TL;DR:** This project is released under the **MIT License**. All Scripture texts, reference works, and theological publications included are in the public domain. You are free to use, modify, reproduce, and distribute this application and its included publications without restriction.

---

## 🙏 Acknowledgments

- **The Holy Bible, King James Version** — the foundation of this entire project
- **James Strong** (1822–1894) — for the Exhaustive Concordance that bridges English readers to the original languages
- **Matthew George Easton** (1823–1894) — for a dictionary that makes biblical scholarship accessible
- **Noah Webster** (1758–1843) — for defining the American English language with biblical context
- **Charles Haddon Spurgeon** (1834–1892) — the "Prince of Preachers" whose works continue to edify the church. Resources sourced from [princeofpreachers.org](https://www.princeofpreachers.org/)
- **Vercel** — for the AI SDK and Gateway that makes multi-provider AI accessible
- **Neon** — for serverless Postgres with pgvector

---

*Built for the glory of God and the edification of His church.*
