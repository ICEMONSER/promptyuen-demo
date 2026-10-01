import { D as React } from "./shared-ui.js";
const h = React.createElement;
import { validPoint, nearestStations, findDistrict } from "./station-core.js";
export function StationPicker({ initial, onSelect, request = 0 }) {
  const [lat, setLat] = React.useState(initial?.incident?.lat ?? "");
  const [lon, setLon] = React.useState(initial?.incident?.lon ?? "");
  const [province, setProvince] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [places, setPlaces] = React.useState([]);
  const [stations, setStations] = React.useState([]);
  const [selected, setSelected] = React.useState(initial?.id || "");
  const [manual, setManual] = React.useState(
    initial?.manual ? initial.name : "",
  );
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [source, setSource] = React.useState(
    initial?.incident?.source || "coordinates",
  );
  const invalidate = () => {
    setStations([]);
    setSelected("");
    onSelect(null);
  };
  const locate = () => {
    invalidate();
    setError("");
    if (!navigator.geolocation) {
      setError("เบราว์เซอร์ไม่รองรับตำแหน่ง กรุณาระบุจังหวัดและอำเภอ");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setSource("geolocation");
        setBusy(false);
        setError("กรุณาตรวจว่าพิกัดนี้คือจุดเกิดเหตุ ก่อนค้นหาสถานี");
      },
      () => {
        setBusy(false);
        setError("ไม่สามารถใช้ตำแหน่งได้ กรุณาระบุจังหวัดและอำเภอหรือพิกัดเอง");
      },
      { timeout: 12000, maximumAge: 0, enableHighAccuracy: true },
    );
  };
  React.useEffect(() => {
    if (request) locate();
  }, [request]);
  async function run(task) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  function choose(station, point) {
    setSelected(station.id);
    onSelect({ ...station, incident: point });
  }
  const input = (label, value, setter) =>
    h(
      "label",
      { className: "assistant-field" },
      label,
      h("input", {
        value,
        onChange: (event) => {
          setter(event.target.value);
          invalidate();
        },
        maxLength: 100,
      }),
    );
  return h(
    "section",
    { className: "assistant-panel", "aria-label": "สถานีตำรวจใกล้จุดเกิดเหตุ" },
    h("h3", null, "สถานีตำรวจใกล้จุดเกิดเหตุ"),
    h(
      "p",
      { className: "small-note" },
      "ตรวจจุดเกิดเหตุก่อนค้นหา ส่งเฉพาะพิกัดหรือชื่อจังหวัดและอำเภอไปยังโอเพนสตรีตแมป ระยะทางเป็นเส้นตรง ไม่ได้ยืนยันเขตรับผิดชอบ",
    ),
    h(
      "button",
      { type: "button", disabled: busy, onClick: locate },
      "ใช้ตำแหน่งปัจจุบันเป็นจุดเกิดเหตุ",
    ),
    h(
      "div",
      { className: "assistant-grid" },
      input("ละติจูด", lat, (v) => {
        setLat(v);
        setSource("coordinates");
      }),
      input("ลองจิจูด", lon, (v) => {
        setLon(v);
        setSource("coordinates");
      }),
    ),
    h(
      "button",
      {
        type: "button",
        disabled: busy || lat === "" || lon === "",
        onClick: () =>
          run(async () => {
            invalidate();
            const point = { lat: Number(lat), lon: Number(lon), source };
            const result = await nearestStations(point);
            setStations(result);
            choose(result[0], point);
          }),
      },
      "ยืนยันจุดเกิดเหตุและค้นหาสถานี",
    ),
    h(
      "div",
      { className: "assistant-grid" },
      input("จังหวัด", province, setProvince),
      input("เขต / อำเภอ", district, setDistrict),
    ),
    h(
      "button",
      {
        type: "button",
        disabled: busy,
        onClick: () =>
          run(async () => {
            invalidate();
            setPlaces(await findDistrict(province, district));
          }),
      },
      "ค้นหาพื้นที่จากจังหวัดและอำเภอ",
    ),
    places.length > 0 &&
      h(
        "label",
        { className: "assistant-field" },
        "เลือกพื้นที่โดยประมาณ แล้วตรวจพิกัดก่อนค้นหาสถานี",
        h(
          "select",
          {
            defaultValue: "",
            onChange: (event) => {
              const place = places[Number(event.target.value)];
              setLat(place.lat);
              setLon(place.lon);
              setSource("district");
              invalidate();
            },
          },
          h("option", { value: "", disabled: true }, "เลือกพื้นที่"),
          ...places.map((place, index) =>
            h("option", { key: index, value: index }, place.name),
          ),
        ),
      ),
    busy && h("p", { role: "status" }, "กำลังค้นหา…"),
    error && h("p", { role: "status" }, error),
    ...stations.map((station) =>
      h(
        "div",
        { key: station.id, className: "station-option" },
        h(
          "label",
          null,
          h("input", {
            type: "radio",
            name: "police-station",
            checked: selected === station.id,
            onChange: () =>
              choose(station, { lat: Number(lat), lon: Number(lon), source }),
          }),
          station.name,
          ` · ${station.distance.toFixed(2)} กม.`,
        ),
        h(
          "a",
          { href: station.mapUrl, target: "_blank", rel: "noreferrer" },
          "ดูแผนที่",
        ),
      ),
    ),
    input("หรือระบุชื่อสถานีที่ต้องการติดต่อเอง", manual, setManual),
    h(
      "button",
      {
        type: "button",
        disabled: busy || !manual.trim(),
        onClick: () =>
          choose(
            { id: "manual", name: manual.trim(), manual: true },
            lat !== "" &&
              lon !== "" &&
              validPoint({ lat: Number(lat), lon: Number(lon) })
              ? { lat: Number(lat), lon: Number(lon), source }
              : null,
          ),
      },
      "เลือกสถานีที่ระบุเอง",
    ),
    selected &&
      h("p", { role: "status" }, "เลือกสถานีแล้ว สามารถเปลี่ยนก่อนยืนยันได้"),
    h("small", null, "ข้อมูลแผนที่ © ผู้ร่วมสร้างโอเพนสตรีตแมป"),
  );
}
