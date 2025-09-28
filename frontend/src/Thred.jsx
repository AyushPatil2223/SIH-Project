import React, { useState } from "react";
import Plot from "react-plotly.js";

export default function OceanDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setError(""); // reset error
      setData(null); // reset previous data

      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      console.log("Backend response:", json);

      if (json.error) {
        setError(`Upload failed: ${json.error}`);
        return;
      }

      const hasData =
        json.temperature?.length > 0 &&
        json.salinity?.length > 0 &&
        json.pressure?.length > 0;

      if (!hasData) {
        setError("Uploaded file does not contain valid profile data.");
        return;
      }

      setData({
        temperature: json.temperature,
        salinity: json.salinity,
        pressure: json.pressure,
        depth: json.depth,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError("An error occurred during upload.");
    }
  };

  // If no data yet, show upload UI
  if (!data)
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-600 p-6">
        <h1 className="text-3xl font-bold text-white mb-6">
          🌊 Ocean 3D Profile Visualization
        </h1>
        <input
          type="file"
          accept=".nc"
          onChange={handleUpload}
          className="p-3 rounded-lg text-black shadow-lg w-full max-w-xs"
        />
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        <p className="text-white mt-4 text-center">
          Upload a .nc file to see the 3D ocean profile.
        </p>
      </div>
    );

  const tempFlat = data.temperature.flat();
  const salFlat = data.salinity.flat();
  const presFlat = data.pressure.flat();

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-600 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">🌊 3D Ocean Profile</h1>

      <div className="w-full max-w-6xl bg-black bg-opacity-70 p-6 rounded-xl shadow-2xl">
        <Plot
          data={[
            {
              x: tempFlat,
              y: salFlat,
              z: presFlat,
              type: "scatter3d",
              mode: "markers+lines",
              marker: {
                size: 5,
                color: tempFlat,
                colorscale: "Viridis",
                colorbar: { title: "Temp (°C)" },
              },
              line: { width: 2, color: "white" },
              hovertemplate:
                "Temp: %{x}°C<br>Sal: %{y} PSU<br>Pressure: %{z} dbar<extra></extra>",
            },
          ]}
          layout={{
            scene: {
              xaxis: { title: { text: "Temperature (°C)", font: { color: "white" } } },
              yaxis: { title: { text: "Salinity (PSU)", font: { color: "white" } } },
              zaxis: {
                title: { text: "Pressure (dbar)", font: { color: "white" } },
                autorange: "reversed",
              },
              camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } },
            },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "white" },
            height: 700,
          }}
          style={{ width: "100%", height: "700px" }}
        />
      </div>

      <p className="text-white mt-4 text-center">
        Explore the 3D ocean profile using mouse drag, zoom, and rotate.
      </p>
    </div>
  );
}
