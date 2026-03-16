# Tjäldjupskarta

![Data updated](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpmatsson%2Ftjale%2Fdata%2Flast-updated.json&query=%24.date&label=data%20updated&color=blue)

Interactive frost depth map for Sweden using [Trafikverket](https://data.trafikverket.se/) weather stations. Live at [frost.foodson.dev](https://frost.foodson.dev).

Data is fetched daily via GitHub Actions and stored on the `data` branch — no backend needed.

## Dev

```sh
npm install
npm run dev        # dev server
npm run typecheck  # type check
npm run build      # production build
```

Set `TRAFIKVERKET_API_KEY` as a repository secret to enable the data fetch. Pushes to `main` deploy automatically.
