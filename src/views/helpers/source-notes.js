/* Source lines shown under the legend and on cards (presentation of model metadata). */

import { fmt } from "../../utils/format.js";

/** "Source: (c) OpenStreetMap contributors ... downloaded <date> via the Overpass API" for a loaded OsmFoot status. */
export function osmSourceHTML(st) {
  const d = st.fetched ? new Date(st.fetched).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "";
  return `Source: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a> (ODbL), ${fmt(st.n)} places downloaded ${d} via the <a href="https://wiki.openstreetmap.org/wiki/Overpass_API" target="_blank" rel="noopener">Overpass API</a>.`;
}
