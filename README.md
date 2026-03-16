# Tjäldjupskarta

Frost depth map for Sweden built on [Trafikverket](https://data.trafikverket.se/) measurement stations. A GitHub Actions workflow fetches fresh data daily and stores it on the `data` branch, so the site works without a backend.

## Development

```sh
npm install
npm run dev
```

The app fetches live data from the `data` branch on GitHub. No local data file needed.

```sh
npm run typecheck
npm run build
```

## Deployment

Pushes to `main` deploy to GitHub Pages automatically. Set `TRAFIKVERKET_API_KEY` as a repository secret to enable the daily data fetch.
