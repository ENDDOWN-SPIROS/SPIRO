/* =====================================================================
   Static reference data (model layer).
   Loads the map's fixed data files once, before any other model runs:
     data/geo/ncr-cities.geojson     17 NCR city/municipality boundaries (PSGC 2023, PSA)
     data/geo/ncr-outline.json       outer NCR boundary, the union of those polygons
     data/geo/city-label-points.json label anchor per city
     data/places/public-places.json  52 listed public places (approximate coordinates)
     data/facilities/facilities.json PhilHealth TB-DOTS facilities in NCR (list of Sep 30, 2026)
   It uses top-level await, so every module that imports these values waits
   until they are loaded. If a file fails, the app shows one error screen
   (see src/app.js) instead of a half-drawn map.
   ===================================================================== */
import { fetchJSON } from "../services/data-service.js";
import { APP_CONFIG } from "../config/app-config.js";

const P = APP_CONFIG.staticData;
const isFeatureCollection = v => v?.type === "FeatureCollection" && Array.isArray(v.features) && v.features.every(f => f.properties?.id && f.geometry?.coordinates);
const isRings = v => Array.isArray(v) && v.length > 0 && v.every(r => Array.isArray(r) && r.every(pt => Array.isArray(pt) && pt.length === 2 && pt.every(Number.isFinite)));
const isPointMap = v => v && typeof v === "object" && Object.values(v).every(pt => Array.isArray(pt) && pt.length === 2 && pt.every(Number.isFinite));
const isPlaces = v => Array.isArray(v) && v.every(p => p.id && p.name && p.cat && p.city && Number.isFinite(p.lat) && Number.isFinite(p.lng));
const isFacilities = v => v?.meta?.updated && Array.isArray(v.facilities) && v.facilities.every(f => Number.isInteger(f.id) && f.n && f.c && /^\d{4}-\d{2}-\d{2}$/.test(f.e));

const [geo, outline, labels, places, facilities] = await Promise.all([
  fetchJSON(P.ncrCities, isFeatureCollection),
  fetchJSON(P.ncrOutline, isRings),
  fetchJSON(P.cityLabels, isPointMap),
  fetchJSON(P.publicPlaces, isPlaces),
  fetchJSON(P.facilities, isFacilities)
]);

export const NCR_GEO = geo;
export const NCR_OUTLINE = outline;
export const CITY_LABEL_PT = labels;
export const VENUE_BASE = places;
export const TB_FAC_META = facilities.meta;
export const TB_FACILITIES = facilities.facilities;
