# 🌟 Nosana & Solana AI Agent

*Conversational automation for Solana and Nosana blockchain tasks.*

<div align="center">

<a href="https://x.com/ajeyakumara07/status/1942493271474987168">
  <img src="https://img.shields.io/badge/🎥%20Watch%20Demo%20Video-Click%20Here-orange?style=for-the-badge" alt="Watch Demo Video" />
</a>

</div>

---

## Features

### Solana Features
- Create SPL tokens and mint initial supply
- Get the Solana balance by wallet address
- Analyze account details by wallet address
- Analyze your transaction with complete information by signature
- Analyze the token supply information of SPL tokens by mint address
- Analyze the token distribution by getting top 10 token holders account information
- Real-time analytics and batch smart contract operations
- Get all associated token accounts for a wallet address (pubkey)

### Nosana Features
- Get Nosana job info by job address
- List all jobs with advanced filtering (state, time, market)
- Get all runs for a specific job
- Get details for a specific run
- Get market info by market address
- Unified analytics and automation for the Nosana network

## Quick Start

```bash
# Clone & enter repo
git clone https://github.com/yourusername/solana-ai-agent.git
cd solana-ai-agent

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start dev server
pnpm run dev
```

Go to [http://localhost:8080](http://localhost:8080)

---

## Deployment

**Docker:**
```bash
docker build -t yourusername/solana-ai-agent:latest .
docker run -p 8080:8080 --env-file .env yourusername/solana-ai-agent:latest
```

**Nosana:**
- Edit `nos_job_def/nosana_mastra.json` with your Docker image
- Deploy via CLI or [Nosana Dashboard](https://dashboard.nosana.com/deploy)

---

## Links
-  [Nosana Deployed Dashboard URL](https://dashboard.nosana.com/jobs/59BAGAjyeXXppXQL48hdSa1AaNE5h2943DQ5FmRJMZWH)
- [Demo Video](https://x.com/ajeyakumara07/status/1942319063415546197)
- [Mastra Docs](https://mastra.ai/docs)
- [Nosana Docs](https://docs.nosana.io)
- [Discord](https://nosana.com/discord)

---

**Built with ❤️🤍 for the Solana & Nosana ecosystem**

*Making blockchain and distributed compute development accessible through AI automation*

