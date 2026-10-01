import {NearestStationSearch} from './nearest-station-ui.js?v=20261002-real-stations';
import { D as React } from "./shared-ui.js";
import { validPoint, parseCoordinateText, policeSearchUrl, incidentMapUrl } from "./station-core.js";
const h = React.createElement;

export function StationPicker({ initial, onSelect, request = 0, place: suppliedPlace = "" }) {
  const [coordinates, setCoordinates] = React.useState(
    validPoint(initial?.incident)
      ? `${initial.incident.lat}, ${initial.incident.lon}`
      : "",
  );
  const [placeOverride, setPlace] = React.useState(initial?.incident?.place ?? null);
  const place = placeOverride ?? suppliedPlace;
  const [manual, setManual] = React.useState(initial?.name || "");
  const [selected, setSelected] = React.useState(Boolean(initial?.name));
  const [source, setSource] = React.useState(initial?.incident?.source || "coordinates");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const locationVersion = React.useRef(0);
  const previousPlace = React.useRef(suppliedPlace);

  function invalidate() {
    locationVersion.current += 1;
    setSelected(false);
    setError("");
    setNotice("");
    onSelect(null);
  }

  React.useEffect(() => {
    if (request) {
      setNotice("ระบุจุดเกิดเหตุด้านล่าง แล้วเปิด Google Maps เพื่อค้นหาสถานีตำรวจ");
    }
  }, [request]);

  React.useEffect(() => {
    if (previousPlace.current !== suppliedPlace && placeOverride === null) { setCoordinates(''); invalidate(); }
    previousPlace.current = suppliedPlace;
  }, [suppliedPlace, placeOverride]);

  function locate() {
    invalidate();
    if (!navigator.geolocation) {
      setError("เบราว์เซอร์ไม่รองรับตำแหน่ง กรุณาระบุพิกัดหรือชื่อสถานที่เกิดเหตุ");
      return;
    }
    const version = locationVersion.current;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusy(false);
        if (locationVersion.current !== version) return;
        setCoordinates(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        setSource("geolocation");
        setNotice("โปรดตรวจว่าตำแหน่งปัจจุบันนี้ตรงกับจุดเกิดเหตุ ก่อนเปิดแผนที่");
      },
      () => {
        setBusy(false);
        if (locationVersion.current !== version) return;
        setError("ไม่สามารถใช้ตำแหน่งได้ กรุณาระบุพิกัดหรือชื่อสถานที่เกิดเหตุ");
      },
      { timeout: 12000, maximumAge: 0, enableHighAccuracy: true },
    );
  }

  let point = null;
  let searchUrl = "";
  let pointUrl = "";
  let locationError = "";
  try {
    if (coordinates.trim()) {
      point = parseCoordinateText(coordinates);
      if (!point) throw new Error("กรุณาวางพิกัดเป็นละติจูด, ลองจิจูด หรือกรอกชื่อสถานที่ในช่องด้านล่าง");
    }
    if (point || place.trim()) {
      searchUrl = policeSearchUrl(point, place);
      pointUrl = incidentMapUrl(point, place);
    }
  } catch (problem) {
    locationError = problem.message;
  }

  function confirmStation() {
    if (locationError) {
      setError(locationError);
      return;
    }
    if (!manual.trim()) return;
    const incident = point
      ? { ...point, source, ...(place.trim() ? { place: place.trim() } : {}) }
      : place.trim() ? { place: place.trim(), source: "place" } : null;
    onSelect({ id: "manual", name: manual.trim(), manual: true, incident });
    setSelected(true);
    setNotice("");
    setError("");
  }

  const input = (label, value, setter, options = {}) =>
    h("label", { className: "assistant-field" }, label,
      h("input", {
        value,
        maxLength: 200,
        ...options,
        onChange: (event) => {
          invalidate();
          setter(event.target.value);
        },
      }),
    );

  return h("section", { className: "assistant-panel", "aria-label": "สถานีตำรวจใกล้จุดเกิดเหตุ" },
    h("h3", null, "สถานีตำรวจใกล้จุดเกิดเหตุ"),
    h("p", { className: "small-note" },
      "ระบุจุดเกิดเหตุแล้วเปิด Google Maps เพื่อค้นหาสถานีตำรวจ ระบบส่งเฉพาะพิกัดหรือชื่อสถานที่เมื่อคุณกดลิงก์ สถานีใกล้จุดเกิดเหตุอาจไม่ใช่สถานีในเขตรับผิดชอบ",
    ),
    input("ละติจูด, ลองจิจูดของจุดเกิดเหตุ", coordinates, (value) => {
      setCoordinates(value);
      setSource("coordinates");
    }, { placeholder: "13.756300, 100.501800", maxLength: 100, autoComplete: "off" }),
    h("p", { className: "small-note" }, "วางพิกัดที่คัดลอกจาก Google Maps โดยเรียงละติจูดก่อนลองจิจูด"),
    input("ชื่อสถานที่เกิดเหตุ พร้อมเขต / อำเภอและจังหวัด (ใช้ค้นหาเมื่อไม่มีพิกัด)", place, setPlace),
    h("button", { type: "button", disabled: busy, onClick: locate },
      "ใช้ตำแหน่งปัจจุบันเป็นจุดเกิดเหตุ",
    ),
    busy && h("p", { role: "status" }, "กำลังขอตำแหน่งปัจจุบัน…"),
    (error || locationError) && h("p", { role: "alert" }, error || locationError),
    notice && h("p", { role: "status" }, notice),
    h(NearestStationSearch, {point, disabled: busy, onSelect: station => {
      invalidate();
      if (station) { setManual(station.name); setSelected(true); onSelect(station); setNotice(`เลือกสถานีใกล้ที่สุดเป็นจุดยื่นเอกสารแล้ว · ${station.distance.toFixed(2)} กม. (ระยะเส้นตรง)`); }
    }}),
    searchUrl && h("div", { className: "assistant-grid" },
      h("a", { href: searchUrl, target: "_blank", rel: "noopener noreferrer" },
        "ค้นหาสถานีตำรวจใกล้จุดเกิดเหตุใน Google Maps",
      ),
      h("a", { href: pointUrl, target: "_blank", rel: "noopener noreferrer" },
        "ตรวจจุดเกิดเหตุบน Google Maps",
      ),
    ),
    h("p", { className: "small-note" },
      "เมื่อดูผลค้นหาใน Google Maps แล้ว ให้กรอกชื่อสถานีที่ต้องการติดต่อและยืนยันด้านล่าง",
    ),
    input("ชื่อสถานีตำรวจที่ต้องการติดต่อ", manual, setManual),
    h("button", {
      type: "button",
      disabled: busy || !manual.trim() || Boolean(locationError),
      onClick: confirmStation,
    }, "ยืนยันสถานีที่ระบุ"),
    selected && h("p", { role: "status" }, `เลือก ${manual.trim()} แล้ว สามารถแก้ไขก่อนยืนยันได้`),
  );
}
