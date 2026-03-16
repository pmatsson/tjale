# Tjäldjupskarta

Frost depth map for Sweden built on [Trafikverket](https://data.trafikverket.se/) measurement stations. A GitHub Actions workflow fetches fresh data hourly and commits it as a static JSON file, so the site works without a backend.

## Development

```sh
npm install
npm run dev
```

`public/data.json` is what the app reads. Trigger the fetch workflow manually to populate it, or drop in a real API response yourself.

```sh
npm run typecheck
npm run build
```

## Deployment

Pushes to `main` deploy to GitHub Pages automatically. Set `TRAFIKVERKET_API_KEY` as a repository secret to enable the data fetch.
