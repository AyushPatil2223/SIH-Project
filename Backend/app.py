from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import xarray as xr
import numpy as np
import pandas as pd
import os

app = FastAPI(title="Argo Profiles API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Path to your static .nc file ---
NC_FILE = os.path.join(os.path.dirname(__file__), "D20250626_prof_0.nc")  # update filename as needed

ds = None
profiles = []

def sanitize_array(arr):
    if arr is None:
        return []
    return [float(x) if np.isfinite(x) else None for x in arr]

# --- Dataset load and profile extraction ---
if os.path.exists(NC_FILE):
    ds = xr.open_dataset(NC_FILE)
    lat = ds["LATITUDE"].values if "LATITUDE" in ds else []
    lon = ds["LONGITUDE"].values if "LONGITUDE" in ds else []
    juld = ds["JULD"].values if "JULD" in ds else []
    profiles = []
    if len(juld) > 0:
        times = pd.to_datetime(juld)
        for i, (la, lo, t) in enumerate(zip(lat, lon, times)):
            profiles.append({
                "index": int(i),
                "lat": float(la),
                "lon": float(lo),
                "time": str(t)
            })

@app.get("/profiles")
def list_profiles():
    if not profiles:
        return {"profiles": [], "n_profiles": 0}
    return {"profiles": profiles, "n_profiles": len(profiles)}

@app.get("/profile/{index}")
def get_profile(index: int):
    if ds is None:
        raise HTTPException(status_code=500, detail="Static dataset not loaded")
    if index < 0 or index >= len(profiles):
        raise HTTPException(status_code=404, detail="Profile index out of range")
    try:
        temp = ds["TEMP_ADJUSTED"].values[index, :] if "TEMP_ADJUSTED" in ds else None
        pres = ds["PRES_ADJUSTED"].values[index, :] if "PRES_ADJUSTED" in ds else None
        sal  = ds["PSAL_ADJUSTED"].values[index, :] if "PSAL_ADJUSTED" in ds else None
        depth = ds["PRES_ADJUSTED"].values[index, :] if "PRES_ADJUSTED" in ds else None  # Pressure as depth proxy

        return {
            "index": index,
            "depth": sanitize_array(depth),
            "temperature": sanitize_array(temp),
            "pressure": sanitize_array(pres),
            "salinity": sanitize_array(sal),
            "lat": profiles[index]["lat"],
            "lon": profiles[index]["lon"],
            "time": profiles[index]["time"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading profile: {e}")

@app.get("/ocean-profile")
def get_single_ocean_profile():
    """
    Returns a static profile (e.g., first profile in loaded .nc file).
    Used by dashboard for automatic visualization.
    """
    if ds is None or not profiles:
        raise HTTPException(status_code=500, detail="No static dataset loaded")
    try:
        temp = ds["TEMP_ADJUSTED"].values[0, :] if "TEMP_ADJUSTED" in ds else None
        pres = ds["PRES_ADJUSTED"].values[0, :] if "PRES_ADJUSTED" in ds else None
        sal  = ds["PSAL_ADJUSTED"].values[0, :] if "PSAL_ADJUSTED" in ds else None
        depth = ds["PRES_ADJUSTED"].values[0, :] if "PRES_ADJUSTED" in ds else None  # using pressure as depth

        return {
            "depth": sanitize_array(depth),
            "temperature": sanitize_array(temp),
            "salinity": sanitize_array(sal),
            "pressure": sanitize_array(pres)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading ocean profile: {e}")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload .nc file and return arrays for first profile"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".nc") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        ds_uploaded = xr.open_dataset(tmp_path)
        # Extract variables and dimensions
        depth = ds_uploaded["PRES_ADJUSTED"][0, :].values if "PRES_ADJUSTED" in ds_uploaded else []
        temperature = ds_uploaded["TEMP_ADJUSTED"][0, :].values if "TEMP_ADJUSTED" in ds_uploaded else []
        salinity = ds_uploaded["PSAL_ADJUSTED"][0, :].values if "PSAL_ADJUSTED" in ds_uploaded else []
        pressure = ds_uploaded["PRES_ADJUSTED"][0, :].values if "PRES_ADJUSTED" in ds_uploaded else []

        # Ensure equal lengths
        min_len = min(len(depth), len(temperature), len(salinity), len(pressure))
        depth_vals = sanitize_array(depth[:min_len])
        temperature_vals = sanitize_array(temperature[:min_len])
        salinity_vals = sanitize_array(salinity[:min_len])
        pressure_vals = sanitize_array(pressure[:min_len])

        return {
            "depth": depth_vals,
            "temperature": temperature_vals,
            "salinity": salinity_vals,
            "pressure": pressure_vals
        }
    except Exception as e:
        print("Upload error:", e)
        return {"error": str(e)}

