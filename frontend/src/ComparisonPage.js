// ComparisonPage.js
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
    LineChart,
    Line,
    Legend,
} from "recharts";

// Fix leaflet icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function ComparisonPage() {
    const [points, setPoints] = useState([]);
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [selectedGraph, setSelectedGraph] = useState("tempVsPres");

    useEffect(() => {
        API.get("/profiles")
            .then((res) => setPoints(res.data.profiles || []))
            .catch((err) => console.error(err));
    }, []);

    // When user clicks on a point
    const handleSelectPoint = (point) => {
        if (selectedPoints.find((p) => p.index === point.index)) return;
        if (selectedPoints.length < 2) {
            setSelectedPoints((prev) => [...prev, point]);

            API.get(`/profile/${point.index}`)
                .then((res) => {
                    const payload = res.data;
                    const temps = payload.temperature || [];
                    const press = payload.pressure || [];
                    const sal = payload.salinity || [];

                    const tempVsPres = press.map((p, i) => ({ pressure: p, temp: temps[i] }));
                    const salVsDepth = sal.map((s, i) => ({ depth: i, salinity: s }));
                    const tempVsDepth = temps.map((t, i) => ({ depth: i, temp: t }));
                    const salVsPres = press.map((p, i) => ({ pressure: p, salinity: sal[i] }));

                    setProfiles((prev) => ({
                        ...prev,
                        [point.index]: { meta: payload, temperature: temps, pressure: press, salinity: sal, tempVsPres, salVsDepth, tempVsDepth, salVsPres },
                    }));
                })
                .catch((err) => console.error(err));
        }
    };

    function getDomain(data, key) {
        if (!data || data.length === 0) return [0, 1];
        const vals = data.map((d) => d[key]).filter((v) => v != null);
        if (vals.length === 0) return [0, 1];
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
        for (let val = start; val <= end; val += step) {
            ticks.push(Number(val.toFixed(2)));
        }
        return ticks;
    };

    function renderGraph(profile, key) {
        if (!profile) return null;

        let data = [];
        let xKey = "";
        let yKey = "";
        let xLabel = "";
        let yLabel = "";
        let fill = "";
        let yReverse = true;

        switch (key) {
            case "tempVsPres":
                data = profile.tempVsPres;
                xKey = "temp";
                yKey = "pressure";
                xLabel = "Temperature (°C)";
                yLabel = "Pressure (dbar)";
                fill = "red";
                break;
            case "salVsDepth":
                data = profile.salVsDepth;
                xKey = "salinity";
                yKey = "depth";
                xLabel = "Salinity (PSU)";
                yLabel = "Depth Level";
                fill = "green";
                yReverse = false;
                break;
            case "pressureVsDepth":
                data = profile.tempVsDepth.map((d, i) => ({
                    depth: d.depth,
                    pressure: profile.salVsPres[i]?.pressure,
                }));
                xKey = "pressure";
                yKey = "depth";
                xLabel = "Pressure (dbar)";
                yLabel = "Depth Level";
                fill = "blue";
                yReverse = false;
                break;
            case "tempVsDepth":
                data = profile.tempVsDepth;
                xKey = "temp";
                yKey = "depth";
                xLabel = "Temperature (°C)";
                yLabel = "Depth Level";
                fill = "orange";
                yReverse = false;
                break;
            default:
                return null;
        }

        return (
            <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 60 }}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                    <XAxis
                        dataKey={xKey}
                        type="number"
                        ticks={createTicks(getDomain(data, xKey))}
                        label={{ value: xLabel, position: "bottom" }}
                    />
                    <YAxis
                        dataKey={yKey}
                        type="number"
                        reversed={yReverse}
                        ticks={createTicks(getDomain(data, yKey))}
                        label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name={xLabel} data={data} fill={fill} />
                </ScatterChart>
            </ResponsiveContainer>
        );
    }

    // Compute summary stats
    const getSummary = (profile) => {
        if (!profile) return null;
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length || 0;
        return {
            avgTemp: avg(profile.temperature).toFixed(2),
            avgSal: avg(profile.salinity).toFixed(2),
            avgPres: avg(profile.pressure).toFixed(2),
            maxTemp: Math.max(...profile.temperature).toFixed(2),
            minTemp: Math.min(...profile.temperature).toFixed(2),
        };
    };

    // Difference graph
    const getDifferenceGraph = () => {
        if (selectedPoints.length < 2) return [];
        const p1 = profiles[selectedPoints[0].index];
        const p2 = profiles[selectedPoints[1].index];
        if (!p1 || !p2) return [];

        return p1.temperature.map((t, i) => ({
            depth: i,
            diffTemp: t - (p2.temperature[i] ?? 0),
            diffSal: (p1.salinity[i] ?? 0) - (p2.salinity[i] ?? 0),
        }));
    };

    const center = points.length ? [points[0].lat, points[0].lon] : [0, 0];

    return (
        <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ textAlign: "center" }}>Compare Two ARGO Profiles</h2>

            {/* Map */}
            <MapContainer center={center} zoom={2} style={{ height: "50vh", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {points.map((p) => (
                    <Marker key={p.index} position={[p.lat, p.lon]}>
                        <Popup>
                            <div>
                                <strong>Index:</strong> {p.index}
                                <br />
                                <strong>Time:</strong> {p.time}
                                <br />
                                <button onClick={() => handleSelectPoint(p)}>Select this point</button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Selected points */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
                {selectedPoints.map((p, i) => (
                    <div key={i} style={{ margin: "10px 0", fontWeight: "bold" }}>
                        Point {i + 1}: Lat {p.lat}, Lon {p.lon}
                    </div>
                ))}
            </div>

            {/* Graph selector */}
            {selectedPoints.length === 2 && (
                <div style={{ marginTop: 30 }}>
                    <label htmlFor="graphSelector" style={{ marginRight: 8, fontWeight: "bold" }}>
                        Select Graph Type:
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
                    </select>
                </div>
            )}

            {/* Graphs side by side */}
            {selectedPoints.length === 2 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 30,
                        marginTop: 20,
                    }}
                >
                    <div>
                        <h4 style={{ textAlign: "center" }}>Point 1</h4>
                        {renderGraph(profiles[selectedPoints[0].index], selectedGraph)}
                    </div>
                    <div>
                        <h4 style={{ textAlign: "center" }}>Point 2</h4>
                        {renderGraph(profiles[selectedPoints[1].index], selectedGraph)}
                    </div>
                </div>
            )}

            {/* Summary Table */}
            {selectedPoints.length === 2 && (
                <div style={{ marginTop: 40 }}>
                    <h3 style={{ textAlign: "center" }}>Summary Statistics</h3>
                    <table
                        style={{
                            margin: "0 auto",
                            borderCollapse: "collapse",
                            width: "70%",
                            textAlign: "center",
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#f2f2f2" }}>
                                <th>Parameter</th>
                                <th>Point 1</th>
                                <th>Point 2</th>
                                <th>Difference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const s1 = getSummary(profiles[selectedPoints[0].index]);
                                const s2 = getSummary(profiles[selectedPoints[1].index]);
                                if (!s1 || !s2) return null;
                                return (
                                    <>
                                        <tr>
                                            <td>Avg Temp (°C)</td>
                                            <td>{s1.avgTemp}</td>
                                            <td>{s2.avgTemp}</td>
                                            <td>{(s1.avgTemp - s2.avgTemp).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td>Avg Salinity (PSU)</td>
                                            <td>{s1.avgSal}</td>
                                            <td>{s2.avgSal}</td>
                                            <td>{(s1.avgSal - s2.avgSal).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td>Avg Pressure (dbar)</td>
                                            <td>{s1.avgPres}</td>
                                            <td>{s2.avgPres}</td>
                                            <td>{(s1.avgPres - s2.avgPres).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td>Max Temp (°C)</td>
                                            <td>{s1.maxTemp}</td>
                                            <td>{s2.maxTemp}</td>
                                            <td>{(s1.maxTemp - s2.maxTemp).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td>Min Temp (°C)</td>
                                            <td>{s1.minTemp}</td>
                                            <td>{s2.minTemp}</td>
                                            <td>{(s1.minTemp - s2.minTemp).toFixed(2)}</td>
                                        </tr>
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Difference Graph */}
            {selectedPoints.length === 2 && (
                <div style={{ marginTop: 40 }}>
                    <h3 style={{ textAlign: "center" }}>Difference Graph (Point1 − Point2)</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={getDifferenceGraph()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="depth" label={{ value: "Depth", position: "insideBottom" }} />
                            <YAxis label={{ value: "Difference", angle: -90, position: "insideLeft" }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="diffTemp" stroke="red" name="Temp Diff (°C)" />
                            <Line type="monotone" dataKey="diffSal" stroke="blue" name="Salinity Diff (PSU)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default ComparisonPage;
