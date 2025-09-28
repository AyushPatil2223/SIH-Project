import React, { useEffect, useState } from "react";
import axios from "axios";

const ProfileTableRows = () => {
    const [profiles, setProfiles] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch all profiles for selector
    useEffect(() => {
        axios
            .get("http://127.0.0.1:8000/profiles")
            .then((res) => {
                setProfiles(res.data.profiles || []);
                if (res.data.profiles.length > 0) {
                    setSelectedIndex(res.data.profiles[0].index);
                }
            })
            .catch((err) => console.error("Profiles fetch error:", err));
    }, []);

    // Fetch data for selected profile
    useEffect(() => {
        if (selectedIndex === null) return;
        setLoading(true);
        axios
            .get(`http://127.0.0.1:8000/profile/${selectedIndex}`)
            .then((res) => {
                setProfileData(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Profile data fetch error:", err);
                setLoading(false);
            });
    }, [selectedIndex]);

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Argo Profile Data</h1>

            {/* Profile selector */}
            <div className="mb-4">
                <label className="mr-2 font-medium">Select Profile:</label>
                <select
                    className="border px-2 py-1 rounded"
                    value={selectedIndex ?? ""}
                    onChange={(e) => setSelectedIndex(Number(e.target.value))}
                >
                    {profiles.map((p) => (
                        <option key={p.index} value={p.index}>
                            Profile #{p.index} (lat: {p.lat.toFixed(2)}, lon: {p.lon.toFixed(2)}, time: {p.time})
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <p className="text-gray-600">Loading profile data...</p>
            ) : !profileData ? (
                <p className="text-red-500">No data available.</p>
            ) : (
                <div className="overflow-x-auto border rounded-lg shadow-md max-h-[500px] overflow-y-auto">
                    <table className="min-w-full border-collapse bg-white">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="border px-4 py-2">Index</th>
                                <th className="border px-4 py-2">Latitude</th>
                                <th className="border px-4 py-2">Longitude</th>
                                <th className="border px-4 py-2">Time</th>
                                <th className="border px-4 py-2">Depth</th>
                                <th className="border px-4 py-2">Temperature (°C)</th>
                                <th className="border px-4 py-2">Salinity (PSU)</th>
                                <th className="border px-4 py-2">Pressure (dbar)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profileData.depth.map((d, i) => (
                                <tr key={i} className="hover:bg-gray-100">
                                    <td className="border px-4 py-2">{i + 1}</td> {/* Sequential row number */}
                                    <td className="border px-4 py-2">{profileData.lat?.toFixed(2)}</td>
                                    <td className="border px-4 py-2">{profileData.lon?.toFixed(2)}</td>
                                    <td className="border px-4 py-2">{profileData.time}</td>
                                    <td className="border px-4 py-2">{d?.toFixed(2)}</td>
                                    <td className="border px-4 py-2">{profileData.temperature[i]?.toFixed(2)}</td>
                                    <td className="border px-4 py-2">{profileData.salinity[i]?.toFixed(2)}</td>
                                    <td className="border px-4 py-2">{profileData.pressure[i]?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProfileTableRows;
