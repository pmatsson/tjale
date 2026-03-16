import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { initMap } from "./map.ts";
import { fetchFrostData, type Station } from "./api.ts";
import { setLanguage, t, type Language } from "./i18n.ts";

const elBtnLoad = document.getElementById("btn-load") as HTMLButtonElement;
const elStatus = document.getElementById("status") as HTMLParagraphElement;
const elOpacity = document.getElementById("opacity-slider") as HTMLInputElement;
const elBtnSv = document.getElementById("btn-sv") as HTMLButtonElement;
const elBtnEn = document.getElementById("btn-en") as HTMLButtonElement;

let stations: Station[] = [];
let dataLoaded = false;

const ctrl = initMap("map");

async function loadData() {
  elBtnLoad.disabled = true;
  setStatus(t("loading"));

  try {
    stations = await fetchFrostData();
    if (stations.length === 0) {
      setStatus(t("noData"), true);
      return;
    }
    dataLoaded = true;
    ctrl.updateMap(stations, parseInt(elOpacity.value));
    setStatus(`${stations.length} ${t("stationsLoaded")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setStatus(`${t("error")}: ${msg}`, true);
  } finally {
    elBtnLoad.disabled = false;
  }
}

function switchLanguage(lang: Language) {
  setLanguage(lang);
  elBtnSv.classList.toggle("active", lang === "sv");
  elBtnEn.classList.toggle("active", lang === "en");
  if (dataLoaded) {
    ctrl.closePopups();
    setStatus(`${stations.length} ${t("stationsLoaded")}`);
  }
}

function setStatus(msg: string, isError = false) {
  elStatus.textContent = msg;
  elStatus.className = isError ? "status-error" : "status-ok";
}

elBtnLoad.addEventListener("click", loadData);
elOpacity.addEventListener("input", () => {
  if (dataLoaded) ctrl.updateOverlayOpacity(parseInt(elOpacity.value));
});
elBtnSv.addEventListener("click", () => switchLanguage("sv"));
elBtnEn.addEventListener("click", () => switchLanguage("en"));

loadData();
