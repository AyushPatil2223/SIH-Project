import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";

export default function OceanProfileLayers() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://127.0.0.1:8000/ocean-profile");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching ocean profile data:", error);
      }
    }
    fetchData();
  }, []);

  if (!data) {
    return <div>Loading ocean profile...</div>;
  }

  const { depth, temperature, salinity, pressure } = data;

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gradient-to-br from-blue-800 to-cyan-700 rounded-lg shadow-lg text-white">
      <h2 className="text-center text-3xl font-semibold mb-6 text-yellow-300">
        Ocean Profile Layers (72 Depth Levels)
      </h2>

      <Plot
        data={[
          {
            x: temperature,
            y: depth,
            mode: "lines+markers",
            name: "Temperature (°C)",
            line: { color: "#FF6F61" },
            marker: { size: 6 },
            hovertemplate: `Depth: %{y} m<br>Temp: %{x} °C<extra></extra>`,
          },
          {
            x: salinity,
            y: depth,
            mode: "lines+markers",
            name: "Salinity (PSU)",
            line: { color: "#4A90E2" },
            marker: { size: 6 },
            hovertemplate: `Depth: %{y} m<br>Salinity: %{x} PSU<extra></extra>`,
          },
          {
            x: pressure,
            y: depth,
            mode: "lines+markers",
            name: "Pressure (dbar)",
            line: { color: "#50E3C2" },
            marker: { size: 6 },
            hovertemplate: `Depth: %{y} m<br>Pressure: %{x} dbar<extra></extra>`,
          },
        ]}
        layout={{
          xaxis: { title: "Measurement Value" },
          yaxis: {
            title: "Depth (m)",
            autorange: "reversed",
            zeroline: false,
            showgrid: true,
          },
          legend: { orientation: "h", x: 0.3, y: -0.2 },
          margin: { l: 60, r: 30, t: 40, b: 60 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(255,255,255,0.1)",
          height: 600,
          hovermode: "closest",
          font: { family: "Arial, sans-serif" },
        }}
        config={{ responsive: true, scrollZoom: true }}
        style={{ width: "100%", height: 600 }}
      />
    </div>
  );
}
