# community-insights-teams-app

#  Community Insights Teams App

This app ingests real developer feedback from GitHub and Stack Overflow, uses AI to extract pain points, and surfaces them via a Teams bot using Adaptive Cards.

## Setup Instructions

1. Clone and install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
```

3. Run it locally:
```bash
npm start
```

4. Register bot in Azure Bot Framework, point messaging endpoint to `/api/messages`.
