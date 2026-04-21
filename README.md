# My Portfolio

Next.js portfolio site for research, articles, and projects.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
```

## GitHub Contributions

The home page can render a GitHub contribution graph from the GitHub GraphQL API.

Set these environment variables locally and in Vercel:

```bash
GITHUB_USERNAME=ayatemp
GITHUB_TOKEN=your_github_token
```

To include private contributions, use a token for the same GitHub account and enable private contribution counts on the GitHub profile.

## Deployment

This project is ready to deploy on Vercel.

1. Import this repository in Vercel.
2. Keep the default Next.js settings.
3. Push updates to `main` to trigger a new deployment.
