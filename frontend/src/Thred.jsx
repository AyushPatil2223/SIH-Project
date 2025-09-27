import React, { useState } from "react";
import Plot from "react-plotly.js";

export default function OceanDepthDashboard() {
  const [data, setData] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      console.log("Backend response:", json);
      setData(json);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  if (!data || !data.depth || data.depth.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-600 p-6">
        <h1 className="text-3xl font-bold text-white mb-6">🌊 Upload Ocean Profile</h1>
        <input
          type="file"
          accept=".nc"
          onChange={handleUpload}
          className="p-3 rounded-lg text-black shadow-lg w-full max-w-xs"
        />
        <p className="text-white mt-4 text-center">
          Upload a .nc file to visualize the ocean depth lines.
        </p>
      </div>
    );
  }

  // Extract arrays
  const depthArr = data.depth;
  const tempArr = data.temperature;
  const presArr = data.pressure;
  const salArr = data.salinity;

  const lineSpacing = 2;
  const depthCount = depthArr.length;

  // Lines with hover showing real depth & other info
  const lineTraces = depthArr.map((d, i) => ({
    x: [0, 10],
    y: [-i * lineSpacing, -i * lineSpacing],
    mode: "lines",
    line: { color: "white", width: 2 },
    hovertemplate:
      `Depth: ${d} m<br>` +
      `Temp: ${tempArr[i] ?? "N/A"} °C<br>` +
      `Pressure: ${presArr[i] ?? "N/A"} dbar<br>` +
      `Salinity: ${salArr[i] ?? "N/A"} PSU<extra></extra>`,
    showlegend: false,
  }));

  // Annotations with simple Point 1, 2, 3… labels
  const annotations = depthArr.map((_, i) => ({
    x: -0.5,
    y: -i * lineSpacing,
    text: `Point ${i + 1}`,
    showarrow: false,
    font: { color: "white", size: 12 },
    xanchor: "right",
    yanchor: "middle",
  }));

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-700 to-blue-900">
      <h1 className="text-3xl font-bold text-white mb-6">🌊 Ocean Depth Lines</h1>

      <div
        className="w-full max-w-5xl p-6 rounded-xl shadow-2xl"
        style={{
          backgroundImage: "url('/images/sea.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Plot
          data={lineTraces} // no scatter needed
          layout={{
            xaxis: { visible: false, range: [-1, 11] },
            yaxis: {
              autorange: "reversed",
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            annotations: annotations,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            height: Math.max(400, depthCount * lineSpacing * 15),
          }}
          style={{ width: "100%", height: Math.max(400, depthCount * lineSpacing * 15) }}
        />
      </div>

      <p className="text-white mt-4 text-center">
        Hover over each line to see real Depth, Temp, Pressure, and Salinity.
      </p>
    </div>
  );
}
