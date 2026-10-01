const COORDINATE_ERROR = "กรุณาระบุละติจูดและลองจิจูดของจุดเกิดเหตุให้ถูกต้อง";
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

function coordinate(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !DECIMAL.test(value.trim())) {
    throw new Error(COORDINATE_ERROR);
  }
  return Number(value.trim());
}

export function validPoint(point) {
  return Boolean(
    point &&
      typeof point === "object" &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lon) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lon) <= 180,
  );
}

export function parseIncidentPoint(lat, lon) {
  const point = { lat: coordinate(lat), lon: coordinate(lon) };
  if (!validPoint(point)) throw new Error(COORDINATE_ERROR);
  return point;
}

// Google Maps copies decimal coordinates in latitude, longitude order.
export function parseCoordinateText(text) {
  if (typeof text !== "string") throw new Error(COORDINATE_ERROR);
  let value = text.trim();
  if (!value) return null;
  const numericPair = /^[\d+\-.,()\s]+$/.test(value) ||
    /^\(?\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*,/.test(value) ||
    /,\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*\)?$/.test(value);
  if (!numericPair) return null;
  if (value.startsWith("(") && value.endsWith(")")) {
    value = value.slice(1, -1).trim();
  }
  const parts = value.includes(",") ? value.split(",") : value.split(/\s+/);
  if (parts.length !== 2) throw new Error(COORDINATE_ERROR);
  return parseIncidentPoint(parts[0], parts[1]);
}

function locationQuery(point, place) {
  // A supplied but invalid point must never silently become a place-only search.
  if (point !== null && point !== undefined) {
    if (!validPoint(point)) throw new Error(COORDINATE_ERROR);
    return `${point.lat},${point.lon}`;
  }
  if (typeof place !== "string" || !place.trim()) {
    throw new Error("กรุณาระบุพิกัดหรือชื่อสถานที่เกิดเหตุให้ชัดเจน");
  }
  return place.trim();
}

function mapsUrl(query) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query);
  if (url.href.length > 2048) {
    throw new Error("ชื่อสถานที่ยาวเกินไป กรุณาระบุชื่อสถานที่ให้กระชับหรือใช้พิกัด");
  }
  return url.href;
}

export function policeSearchUrl(point, place = "") {
  return mapsUrl(`สถานีตำรวจ ใกล้ ${locationQuery(point, place)}`);
}

export function incidentMapUrl(point, place = "") {
  return mapsUrl(locationQuery(point, place));
}
