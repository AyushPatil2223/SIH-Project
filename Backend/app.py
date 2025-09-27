from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import xarray as xr
import numpy as np
import pandas as pd
import os

app = FastAPI(title="Argo Profiles API")

# --- CORS setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Path to your static .nc file ---
NC_FILE = os.path.join(os.path.dirname(__file__), "D20250626_prof_0.nc")  # replace with actual filename

ds = None
profiles = []

if os.path.exists(NC_FILE):
    ds = xr.open_dataset(NC_FILE)

    # --- Extract profiles metadata ---
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


# --- Helper to sanitize arrays for JSON ---
def sanitize_array(arr):
    if arr is None:
        return []
    return [float(x) if np.isfinite(x) else None for x in arr]


# ---------------- ROUTES ---------------- #

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

        return {
            "index": index,
            "temperature": sanitize_array(temp),
            "pressure": sanitize_array(pres),
            "salinity": sanitize_array(sal),
            "lat": profiles[index]["lat"],
            "lon": profiles[index]["lon"],
            "time": profiles[index]["time"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading profile: {e}")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload .nc file and return 1D arrays along n_levels:
    - depth (n_levels)
    - temperature (first profile)
    - salinity (first profile)
    - pressure (first profile)
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".nc") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Open dataset
        ds_uploaded = xr.open_dataset(tmp_path)
        print("Uploaded file variables:", list(ds_uploaded.variables.keys()))

        # Extract variables
        depth = ds_uploaded["n_levels"] if "n_levels" in ds_uploaded.dims else None
        temperature = ds_uploaded["temp_adjusted"] if "temp_adjusted" in ds_uploaded.variables else None
        salinity = ds_uploaded["psal_adjusted"] if "psal_adjusted" in ds_uploaded.variables else None
        pressure = ds_uploaded["pres_adjusted"] if "pres_adjusted" in ds_uploaded.variables else None

        # Extract depth values
        depth_vals = list(range(ds_uploaded.dims["n_levels"])) if "n_levels" in ds_uploaded.dims else []

        # Helper for first profile extraction
        def extract_first_profile(var):
            if var is None:
                return []
            if "n_prof" in var.dims:
                return var.isel(n_prof=0).values.tolist()
            return var.values.tolist()

        temperature_vals = extract_first_profile(temperature)
        salinity_vals = extract_first_profile(salinity)
        pressure_vals = extract_first_profile(pressure)

        # Ensure equal lengths
        min_len = min(len(depth_vals), len(temperature_vals), len(salinity_vals), len(pressure_vals))
        depth_vals = depth_vals[:min_len]
        temperature_vals = temperature_vals[:min_len]
        salinity_vals = salinity_vals[:min_len]
        pressure_vals = pressure_vals[:min_len]

        return {
            "depth": depth_vals,
            "temperature": temperature_vals,
            "salinity": salinity_vals,
            "pressure": pressure_vals
        }

    except Exception as e:
        print("Upload error:", e)
        return {"error": str(e)}
