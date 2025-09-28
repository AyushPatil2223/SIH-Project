import React, { useEffect, useState } from "react";
import API from "./api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ReportButton from "./ReportButton";

// Fix leaflet icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Dashboard helpers
function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: color,
        color: "#fff",
        borderRadius: 13,
        padding: "22px 26px",
        minWidth: 120,
        textAlign: "center",
        boxShadow: "0 2px 12px rgba(40,100,200,0.11)",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Dashboard({ stats, meta }) {
  return (
    <div
      style={{
        margin: "32px auto 0 auto",
        maxWidth: 900,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 8px 28px rgba(60,120,255,0.11)",
        padding: "22px 32px 28px 32px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #e9f2fa",
          paddingBottom: 10,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 700, color: "#315dbd" }}>Dashboard</span>
        {meta && (
          <span style={{ fontSize: 18, color: "#326fa8", fontWeight: 500 }}>
            {meta.index !== undefined && `Profile #${meta.index}`}
            {meta.time && <span style={{ marginLeft: 18, color: "#666" }}>Time: {meta.time}</span>}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
        <StatCard label="Avg Temp" value={`${stats.avgTemp}°C`} color="linear-gradient(135deg,#58caff,#3f8efc)" />
        <StatCard label="Max Temp" value={`${stats.maxTemp}°C`} color="linear-gradient(135deg,#fcaf3f,#fd5e53)" />
        <StatCard label="Min Temp" value={`${stats.minTemp}°C`} color="linear-gradient(135deg,#3aadaa,#1e6460)" />
        <StatCard label="Avg Salinity" value={`${stats.avgSal} PSU`} color="linear-gradient(135deg,#3ac7a7,#0ea082)" />
        <StatCard label="Max Salinity" value={`${stats.maxSal} PSU`} color="linear-gradient(135deg,#a7f3d0,#3f8efc)" />
        <StatCard label="Min Salinity" value={`${stats.minSal} PSU`} color="linear-gradient(135deg,#7af3a7,#49c7fc)" />
      </div>
    </div>
  );
}

function calcStats(profileData) {
  if (!profileData) return null;
  const { tempVsDepth, salVsDepth } = profileData;
  const temps = tempVsDepth?.map(d => d.temp).filter(v => v != null) || [];
  const sals = salVsDepth?.map(d => d.salinity).filter(v => v != null) || [];
  const avg = arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  return {
    avgTemp: avg(temps).toFixed(2),
    avgSal: avg(sals).toFixed(2),
    maxTemp: temps.length ? Math.max(...temps).toFixed(2) : "-",
    minTemp: temps.length ? Math.min(...temps).toFixed(2) : "-",
    maxSal: sals.length ? Math.max(...sals).toFixed(2) : "-",
    minSal: sals.length ? Math.min(...sals).toFixed(2) : "-",
  };
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 8,
          width: "80vw",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{ float: "right", fontSize: 16, marginBottom: 10 }}
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
}

function Homepage() {
  const [points, setPoints] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [selectedGraph, setSelectedGraph] = useState("tempVsPres");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGraphKey, setModalGraphKey] = useState(null);

  useEffect(() => {
    API.get("/profiles")
      .then((res) => setPoints(res.data.profiles || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedIndex == null) return;
    API.get(`/profile/${selectedIndex}`)
      .then((res) => {
        const payload = res.data;
        const temps = payload.temperature || [];
        const press = payload.pressure || [];
        const sal = payload.salinity || [];
        const tempVsPres = press.map((p, i) => ({ pressure: p, temp: temps[i] }));
        const salVsDepth = sal.map((s, i) => ({ depth: i, salinity: s }));
        const tempVsDepth = temps.map((t, i) => ({ depth: i, temp: t }));
        const salVsPres = press.map((p, i) => ({ pressure: p, salinity: sal[i] }));
        setProfileData({ meta: payload, tempVsPres, salVsDepth, tempVsDepth, salVsPres });
      })
      .catch((err) => console.error(err));
  }, [selectedIndex]);

  const center = points.length ? [points[0].lat, points[0].lon] : [0, 0];

  function getDomain(data, key) {
    if (!data || data.length === 0) return [0, 1];
    const vals = data.map(d => d[key]).filter(v => v != null);
    if (!vals.length) return [0, 1];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const padding = (max - min) * 0.05;
    return [min - padding, max + padding];
  }

  const createTicks = (domain, stepApprox = 5) => {
    const [min, max] = domain;
    if (max - min < stepApprox) return [min, max];
    const magnitude = Math.pow(10, Math.floor(Math.log10(max - min)));
    const step = Math.max(stepApprox, magnitude / 2);
    const start = Math.floor(min / step) * step;
    const end = Math.ceil(max / step) * step;
    let ticks = [];
    for (let val = start; val <= end; val += step) ticks.push(Number(val.toFixed(2)));
    return ticks;
  };

  function handleGraphClick(graphKey) {
    setModalGraphKey(graphKey);
    setModalOpen(true);
  }

  function renderGraph(key, large = false) {
    if (!profileData) return null;
    const commonProps = {
      margin: { top: 20, right: 40, bottom: 40, left: 60 },
      data: null,
      xKey: "",
      yKey: "",
      xLabel: "",
      yLabel: "",
      xTicks: [],
      yTicks: [],
      yReverse: true,
      fill: "",
      width: "100%",
      height: large ? 500 : 300,
    };
    switch (key) {
      case "tempVsPres":
        commonProps.data = profileData.tempVsPres;
        commonProps.xKey = "temp";
        commonProps.yKey = "pressure";
        commonProps.xLabel = "Temperature (°C)";
        commonProps.yLabel = "Pressure (dbar)";
        commonProps.xTicks = createTicks(getDomain(profileData.tempVsPres, "temp"));
        commonProps.yTicks = createTicks(getDomain(profileData.tempVsPres, "pressure"), 50);
        commonProps.fill = "red";
        break;
      case "salVsDepth":
        commonProps.data = profileData.salVsDepth;
        commonProps.xKey = "salinity";
        commonProps.yKey = "depth";
        commonProps.xLabel = "Salinity (PSU)";
        commonProps.yLabel = "Depth Level";
        commonProps.xTicks = createTicks(getDomain(profileData.salVsDepth, "salinity"), 0.2);
        commonProps.yTicks = createTicks(getDomain(profileData.salVsDepth, "depth"), 200);
        commonProps.fill = "green";
        break;
      case "pressureVsDepth":
        commonProps.data = profileData.tempVsDepth.map((d, i) => ({
          depth: d.depth,
          pressure: profileData.salVsPres[i]?.pressure,
        }));
        commonProps.xKey = "pressure";
        commonProps.yKey = "depth";
        commonProps.xLabel = "Pressure (dbar)";
        commonProps.yLabel = "Depth Level";
        commonProps.xTicks = createTicks(getDomain(profileData.salVsPres, "pressure"), 200);
        commonProps.yTicks = createTicks(getDomain(profileData.salVsPres, "depth"), 200);
        commonProps.fill = "blue";
        break;
      case "tempVsDepth":
        commonProps.data = profileData.tempVsDepth;
        commonProps.xKey = "temp";
        commonProps.yKey = "depth";
        commonProps.xLabel = "Temperature (°C)";
        commonProps.yLabel = "Depth Level";
        commonProps.xTicks = createTicks(getDomain(profileData.tempVsDepth, "temp"));
        commonProps.yTicks = createTicks(getDomain(profileData.tempVsDepth, "depth"), 200);
        commonProps.fill = "orange";
        break;
      default:
        return null;
    }
    return (
      <div
        onClick={() => !large && handleGraphClick(key)}
        style={{ cursor: large ? "default" : "pointer" }}
      >
        <h4 style={{ textAlign: "center" }}>
          {commonProps.xLabel} vs {commonProps.yLabel}
        </h4>
        <ResponsiveContainer width={commonProps.width} height={commonProps.height}>
          <ScatterChart margin={commonProps.margin}>
            <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
            <XAxis
              dataKey={commonProps.xKey}
              type="number"
              ticks={commonProps.xTicks}
              label={{ value: commonProps.xLabel, position: "bottom", offset: 0 }}
            />
            <YAxis
              dataKey={commonProps.yKey}
              type="number"
              reversed={commonProps.yReverse}
              ticks={commonProps.yTicks}
              label={{ value: commonProps.yLabel, angle: -90, position: "insideLeft" }}
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name={commonProps.xLabel} data={commonProps.data} fill={commonProps.fill} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>ARGO Profile Visualization</h2>
      <MapContainer center={center} zoom={2} style={{ height: "50vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {points.map((p) => (
          <Marker key={p.index} position={[p.lat, p.lon]}>
            <Popup>
              <div>
                <div>
                  <strong>Index:</strong> {p.index}
                </div>
                <div>
                  <strong>Time:</strong> {p.time}
                </div>
                <button onClick={() => setSelectedIndex(p.index)}>Select this profile</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {profileData && (
        <>
          {/* ✅ Wrap dashboard + graphs in report-section for PDF */}
          <div id="report-section">
            <Dashboard stats={calcStats(profileData)} meta={profileData.meta} />

            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <label htmlFor="graphSelector" style={{ marginRight: 8, fontWeight: "bold" }}>
                Select Graph:
              </label>
              <select
                id="graphSelector"
                value={selectedGraph}
                onChange={(e) => setSelectedGraph(e.target.value)}
              >
                <option value="tempVsPres">Temperature vs Pressure</option>
                <option value="salVsDepth">Salinity vs Depth</option>
                <option value="pressureVsDepth">Pressure vs Depth</option>
                <option value="tempVsDepth">Temperature vs Depth</option>
                <option value="all">Show All</option>
              </select>
            </div>

            {selectedGraph === "all" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 30,
                  marginTop: 20,
                }}
              >
                {renderGraph("tempVsPres")}
                {renderGraph("salVsDepth")}
                {renderGraph("pressureVsDepth")}
                {renderGraph("tempVsDepth")}
              </div>
            ) : (
              <div style={{ maxWidth: 700, margin: "0 auto" }}>{renderGraph(selectedGraph)}</div>
            )}
          </div>

          {/* ✅ Report Button */}
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <ReportButton />
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        {renderGraph(modalGraphKey, true)}
      </Modal>
    </div>
  );
}

export default Homepage;
