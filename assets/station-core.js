export function haversine(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const x =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) *
      Math.cos(rad(b.lat)) *
      Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return (
    6371 *
    2 *
    Math.atan2(Math.sqrt(Math.min(1, x)), Math.sqrt(Math.max(0, 1 - x)))
  );
}
export function validPoint(point) {
  return (
    point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lon) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lon) <= 180
  );
}
export function rankStations(elements, point) {
  const seen = new Set();
  return elements
    .flatMap((item) => {
      const loc = {
        lat: item.lat ?? item.center?.lat,
        lon: item.lon ?? item.center?.lon,
      };
      if (!validPoint(loc)) return [];
      const name =
        item.tags?.["name:th"] ||
        (/[ก-๙]/.test(item.tags?.name || "") ? item.tags.name : "สถานีตำรวจ");
      const key = `${name}:${loc.lat.toFixed(4)}:${loc.lon.toFixed(4)}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [
        {
          id: `${item.type}/${item.id}`,
          name,
          ...loc,
          distance: haversine(point, loc),
          mapUrl: `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lon}#map=16/${loc.lat}/${loc.lon}`,
        },
      ];
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
}
// Cache only public map results in memory. No case details are sent to the map service.
const mapCache = new Map();
const OVERPASS = "https://overpass.private.coffee/api/interpreter";
async function queryMap(query) {
  const cached = mapCache.get(query);
  if (cached && Date.now() - cached.time < 300000) return cached.value;
  try {
    const response = await fetch(OVERPASS, {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      credentials: "omit",
      referrerPolicy: "origin",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data.remark || !Array.isArray(data.elements)) throw new Error();
    if (mapCache.size >= 30) mapCache.delete(mapCache.keys().next().value);
    mapCache.set(query, { time: Date.now(), value: data });
    return data;
  } catch {
    throw new Error("ค้นหาสถานีไม่สำเร็จ กรุณาลองใหม่หรือระบุสถานีด้วยตนเอง");
  }
}
export async function nearestStations(point) {
  if (!validPoint(point)) throw new Error("กรุณาตรวจละติจูดและลองจิจูด");
  const query = `[out:json][timeout:20];nwr["amenity"="police"](around:50000,${point.lat},${point.lon});out center tags;`;
  const data = await queryMap(query);
  const stations = rankStations(data.elements || [], point);
  if (!stations.length)
    throw new Error("ไม่พบสถานีในระยะ 50 กิโลเมตร กรุณาระบุสถานีด้วยตนเอง");
  return stations;
}
export async function findDistrict(province, district) {
  if (!province.trim() || !district.trim())
    throw new Error("กรุณาระบุจังหวัดและเขตหรืออำเภอ");
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const provinceName = province.trim().replace(/^(จังหวัด|จ\.)\s*/, "");
  const districtName = district.trim().replace(/^(อำเภอ|เขต|อ\.)\s*/, "");
  const query = `[out:json][timeout:25];area["boundary"="administrative"]["admin_level"="4"]["name"~${JSON.stringify(escapeRegex(provinceName) + "$")}]->.province;relation(area.province)["boundary"="administrative"]["admin_level"="6"]["name"~${JSON.stringify(escapeRegex(districtName) + "$")}];out center tags;`;
  const data = await queryMap(query);
  const places = data.elements
    .map((item) => ({
      lat: item.center?.lat,
      lon: item.center?.lon,
      name:
        item.tags?.["name:th"] ||
        item.tags?.name ||
        `${districtName} ${provinceName}`,
    }))
    .filter(validPoint);
  if (!places.length)
    throw new Error(
      "ไม่พบพื้นที่ กรุณาตรวจชื่อจังหวัดและเขตหรืออำเภอ หรือระบุพิกัดเอง",
    );
  return places;
}
