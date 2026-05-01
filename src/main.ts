import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { initMap } from "./map.ts";
import { fetchFrostData, fetchManifest, type Station } from "./api.ts";
import { setLanguage, t, getLang, type Language } from "./i18n.ts";
import type { DisplayMode } from "./interpolation.ts";

const elStatus        = document.getElementById("status")          as HTMLParagraphElement;
const elOpacity       = document.getElementById("opacity-slider")  as HTMLInputElement;
const elBtnSv         = document.getElementById("btn-sv")          as HTMLButtonElement;
const elBtnEn         = document.getElementById("btn-en")          as HTMLButtonElement;
const elTlSlider      = document.getElementById("tl-slider")       as HTMLInputElement;
const elTlDate        = document.getElementById("tl-date")         as HTMLElement;
const elTlLive        = document.getElementById("tl-live")         as HTMLElement;
const elBtnPrev       = document.getElementById("btn-prev")        as HTMLButtonElement;
const elBtnPlay       = document.getElementById("btn-play")        as HTMLButtonElement;
const elBtnNext       = document.getElementById("btn-next")        as HTMLButtonElement;
const elTlStart       = document.getElementById("tl-label-start")  as HTMLElement;
const elTlEnd         = document.getElementById("tl-label-end")    as HTMLElement;
const elTlPanel       = document.getElementById("panel-timeline")  as HTMLElement;
const elBtnModeDepth  = document.getElementById("btn-mode-depth")  as HTMLButtonElement;
const elBtnModeLine   = document.getElementById("btn-mode-line")   as HTMLButtonElement;

const ctrl = initMap("map");
let stations: Station[]      = [];
let dates: string[]          = [];
let currentIndex             = 0;
let displayMode: DisplayMode = "depth";
let isPlaying                = false;
let playTimer: ReturnType<typeof setInterval> | null = null;
let fetchToken               = 0;

function fmtLong(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString(
    getLang() === "sv" ? "sv-SE" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

function fmtShort(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString(
    getLang() === "sv" ? "sv-SE" : "en-GB",
    { month: "short", year: "numeric" }
  );
}

function setStatus(msg: string, isError = false) {
  elStatus.textContent = msg;
  elStatus.className = isError ? "status-error" : "status-ok";
}

function setTimelineUI(index: number) {
  const isLatest = dates.length > 0 && index === dates.length - 1;
  elTlSlider.value = String(index);
  elTlDate.textContent = dates[index] ? fmtLong(dates[index]) : "—";
  elTlLive.classList.toggle("visible", isLatest || dates.length === 0);
  elBtnPrev.disabled = index <= 0;
  elBtnNext.disabled = index >= dates.length - 1;
}

function setLoading(on: boolean) {
  const noHistory = dates.length === 0;
  elTlPanel.classList.toggle("loading", on);
  elTlSlider.disabled = on || noHistory;
  elBtnPlay.disabled  = on || noHistory;
  elBtnPrev.disabled  = on || noHistory || currentIndex <= 0;
  elBtnNext.disabled  = on || noHistory || currentIndex >= dates.length - 1;
}

function setPlaying(on: boolean) {
  isPlaying = on;
  elBtnPlay.classList.toggle("playing", on);
  elBtnPlay.innerHTML = on ? iconPause() : iconPlay();
  elBtnPlay.title = t(on ? "pause" : "play");
}

const iconPlay  = () => `<svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor"><path d="M1 1.5l9 5-9 5V1.5z"/></svg>`;
const iconPause = () => `<svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor"><rect x="0.5" y="1" width="3.5" height="11" rx="1"/><rect x="7" y="1" width="3.5" height="11" rx="1"/></svg>`;
const iconPrev  = () => `<svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><rect x="0" y="0" width="2" height="12" rx="1"/><path d="M9 1L2 6l7 5V1z"/></svg>`;
const iconNext  = () => `<svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><rect x="8" y="0" width="2" height="12" rx="1"/><path d="M1 1l7 5-7 5V1z"/></svg>`;

async function loadDate(index: number, animate = true) {
  const isLatest = dates.length === 0 || index === dates.length - 1;
  const date = dates[index];
  const token = ++fetchToken;

  setLoading(true);
  setStatus(t("loading"));

  try {
    const data = await fetchFrostData(isLatest ? undefined : date);
    if (token !== fetchToken) return;

    stations = data;
    if (!stations.length) { setStatus(t("noData"), true); return; }

    setStatus(`${stations.length} ${t("stationsLoaded")}`);
    const pct = parseInt(elOpacity.value);
    if (animate) {
      await ctrl.transitionMap(stations, pct, displayMode);
    } else {
      ctrl.updateMap(stations, pct, displayMode);
    }
  } catch (err) {
    if (token !== fetchToken) return;
    setStatus(`${t("error")}: ${err instanceof Error ? err.message : err}`, true);
  } finally {
    if (token === fetchToken) setLoading(false);
  }
}

async function initTimeline() {
  elBtnPlay.innerHTML = iconPlay();
  elBtnPrev.innerHTML = iconPrev();
  elBtnNext.innerHTML = iconNext();

  try {
    dates = await fetchManifest();
  } catch { /* no history */ }

  if (dates.length > 0) {
    currentIndex = dates.length - 1;
    elTlSlider.min   = "0";
    elTlSlider.max   = String(dates.length - 1);
    elTlSlider.value = String(currentIndex);
    elTlStart.textContent = fmtShort(dates[0]);
    elTlEnd.textContent   = fmtShort(dates[dates.length - 1]);
  }

  setTimelineUI(currentIndex);
  await loadDate(currentIndex, false);
}

function startPlay() {
  if (currentIndex >= dates.length - 1) {
    currentIndex = 0;
    setTimelineUI(0);
  }
  setPlaying(true);
  playTimer = setInterval(async () => {
    if (currentIndex >= dates.length - 1) { stopPlay(); return; }
    currentIndex++;
    setTimelineUI(currentIndex);
    await loadDate(currentIndex);
  }, 1800);
}

function stopPlay() {
  if (playTimer) { clearInterval(playTimer); playTimer = null; }
  setPlaying(false);
}

let sliderDebounce: ReturnType<typeof setTimeout> | null = null;

elTlSlider.addEventListener("input", () => {
  const idx = parseInt(elTlSlider.value);
  currentIndex = idx;
  setTimelineUI(idx);
  stopPlay();
  if (sliderDebounce) clearTimeout(sliderDebounce);
  sliderDebounce = setTimeout(() => loadDate(idx), 300);
});

elBtnPrev.addEventListener("click", () => {
  if (currentIndex <= 0) return;
  stopPlay();
  currentIndex--;
  setTimelineUI(currentIndex);
  loadDate(currentIndex);
});

elBtnNext.addEventListener("click", () => {
  if (currentIndex >= dates.length - 1) return;
  stopPlay();
  currentIndex++;
  setTimelineUI(currentIndex);
  loadDate(currentIndex);
});

elBtnPlay.addEventListener("click", () => {
  if (isPlaying) stopPlay(); else startPlay();
});

elTlLive.addEventListener("click", () => {
  if (!dates.length) return;
  stopPlay();
  currentIndex = dates.length - 1;
  setTimelineUI(currentIndex);
  loadDate(currentIndex);
});

elOpacity.addEventListener("input", () => {
  ctrl.updateOverlayOpacity(parseInt(elOpacity.value));
});

function setDisplayMode(mode: DisplayMode) {
  displayMode = mode;
  elBtnModeDepth.classList.toggle("active", mode === "depth");
  elBtnModeLine.classList.toggle("active", mode === "frost-line");
  if (stations.length > 0) ctrl.updateMap(stations, parseInt(elOpacity.value), displayMode);
}

elBtnModeDepth.addEventListener("click", () => setDisplayMode("depth"));
elBtnModeLine.addEventListener("click", () => setDisplayMode("frost-line"));

function switchLanguage(lang: Language) {
  setLanguage(lang);
  elBtnSv.classList.toggle("active", lang === "sv");
  elBtnEn.classList.toggle("active", lang === "en");
  if (dates.length > 0) {
    setTimelineUI(currentIndex);
    elTlStart.textContent = fmtShort(dates[0]);
    elTlEnd.textContent   = fmtShort(dates[dates.length - 1]);
  }
  if (stations.length > 0) {
    ctrl.closePopups();
    setStatus(`${stations.length} ${t("stationsLoaded")}`);
  }
}

elBtnSv.addEventListener("click", () => switchLanguage("sv"));
elBtnEn.addEventListener("click", () => switchLanguage("en"));

initTimeline();
