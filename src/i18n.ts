export type Language = "sv" | "en";

export type TranslationKey =
  | "title"
  | "subtitle"
  | "refreshButton"
  | "loading"
  | "error"
  | "noData"
  | "frostDepth"
  | "depth"
  | "station"
  | "lastMeasured"
  | "stationsLoaded"
  | "legendNone"
  | "legendDeep"
  | "opacity"
  | "temperatureProfile"
  | "noFrostFound"
  | "frostRange";

const translations: Record<Language, Record<TranslationKey, string>> = {
  sv: {
    title: "Tjäldjupskarta",
    subtitle: "Aktuellt tjäldjup i Sverige",
    refreshButton: "Uppdatera",
    loading: "Hämtar data…",
    error: "Fel vid hämtning av data",
    noData: "Ingen data tillgänglig",
    frostDepth: "Tjäldjup",
    depth: "Djup",
    station: "Mätstation",
    lastMeasured: "Senast mätt",
    stationsLoaded: "stationer laddade",
    legendNone: "Ingen tjäle",
    legendDeep: "Djup tjäle",
    opacity: "Opacitet",
    temperatureProfile: "Temperaturprofil",
    noFrostFound: "Ingen tjäle detekterad",
    frostRange: "Tjäle (från–till)",
  },
  en: {
    title: "Frost Depth Map",
    subtitle: "Current frost depth in Sweden",
    refreshButton: "Refresh",
    loading: "Fetching data…",
    error: "Error fetching data",
    noData: "No data available",
    frostDepth: "Frost depth",
    depth: "Depth",
    station: "Measurement station",
    lastMeasured: "Last measured",
    stationsLoaded: "stations loaded",
    legendNone: "No frost",
    legendDeep: "Deep frost",
    opacity: "Opacity",
    temperatureProfile: "Temperature profile",
    noFrostFound: "No frost detected",
    frostRange: "Frost layer (top–bottom)",
  },
};

let currentLang: Language = "sv";

export function setLanguage(lang: Language): void {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as TranslationKey;
    if (key in translations[currentLang]) {
      el.textContent = translations[currentLang][key];
    }
  });
}

export function t(key: TranslationKey): string {
  return translations[currentLang][key];
}
