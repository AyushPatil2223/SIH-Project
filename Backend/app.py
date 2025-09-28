from fastapi import FastAPI, UploadFile, File, HTTPException,Query
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
NC_FILE = os.path.join(os.path.dirname(__file__), "D20250626_prof_0.nc")  # update filename

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
        depth = ds["PRES_ADJUSTED"].values[index, :] if "PRES_ADJUSTED" in ds else None

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
    if ds is None or not profiles:
        raise HTTPException(status_code=500, detail="No static dataset loaded")
    try:
        temp = ds["TEMP_ADJUSTED"].values[0, :] if "TEMP_ADJUSTED" in ds else None
        pres = ds["PRES_ADJUSTED"].values[0, :] if "PRES_ADJUSTED" in ds else None
        sal  = ds["PSAL_ADJUSTED"].values[0, :] if "PSAL_ADJUSTED" in ds else None
        depth = ds["PRES_ADJUSTED"].values[0, :] if "PRES_ADJUSTED" in ds else None

        return {
            "depth": sanitize_array(depth),
            "temperature": sanitize_array(temp),
            "salinity": sanitize_array(sal),
            "pressure": sanitize_array(pres)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading ocean profile: {e}")

@app.get("/table-all")
def get_all_profiles_table(page: int = 1, rows_per_page: int = 50):
    """
    Returns all profiles in one row per profile.
    Columns 'depth', 'temperature', 'salinity', 'pressure' contain arrays.
    """
    if ds is None:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    temp_var = ds["TEMP_ADJUSTED"].values if "TEMP_ADJUSTED" in ds else np.array([])
    pres_var = ds["PRES_ADJUSTED"].values if "PRES_ADJUSTED" in ds else np.array([])
    sal_var  = ds["PSAL_ADJUSTED"].values if "PSAL_ADJUSTED" in ds else np.array([])
    lat_var  = ds["LATITUDE"].values if "LATITUDE" in ds else np.array([])
    lon_var  = ds["LONGITUDE"].values if "LONGITUDE" in ds else np.array([])
    juld_var = ds["JULD"].values if "JULD" in ds else np.array([])

    all_rows = []

    for idx in range(len(lat_var)):
        # Get arrays for this profile
        depth = pres_var[idx, :].tolist() if pres_var.size else []
        temp = temp_var[idx, :].tolist() if temp_var.size else []
        sal  = sal_var[idx, :].tolist() if sal_var.size else []
        pres = pres_var[idx, :].tolist() if pres_var.size else []

        # Optional: sanitize numeric values
        depth = [float(x) if np.isfinite(x) else None for x in depth]
        temp = [float(x) if np.isfinite(x) else None for x in temp]
        sal = [float(x) if np.isfinite(x) else None for x in sal]
        pres = [float(x) if np.isfinite(x) else None for x in pres]

        all_rows.append({
            "index": idx,
            "lat": float(lat_var[idx]),
            "lon": float(lon_var[idx]),
            "time": str(pd.to_datetime(juld_var[idx])),
            "depth": depth,
            "temperature": temp,
            "salinity": sal,
            "pressure": pres
        })

    # Pagination
    total_rows = len(all_rows)
    start = (page - 1) * rows_per_page
    end = start + rows_per_page
    paginated_rows = all_rows[start:end]

    return {
        "rows": paginated_rows,
        "n_rows": total_rows,
        "page": page,
        "rows_per_page": rows_per_page,
        "total_pages": (total_rows + rows_per_page - 1) // rows_per_page
    }



@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".nc") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        ds_uploaded = xr.open_dataset(tmp_path)
        depth = ds_uploaded["PRES_ADJUSTED"][0, :].values if "PRES_ADJUSTED" in ds_uploaded else []
        temperature = ds_uploaded["TEMP_ADJUSTED"][0, :].values if "TEMP_ADJUSTED" in ds_uploaded else []
        salinity = ds_uploaded["PSAL_ADJUSTED"][0, :].values if "PSAL_ADJUSTED" in ds_uploaded else []
        pressure = ds_uploaded["PRES_ADJUSTED"][0, :].values if "PRES_ADJUSTED" in ds_uploaded else []

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

@app.get("/variables")
def list_variables():
    """List all variables in the loaded NetCDF file"""
    if ds is None:
        raise HTTPException(status_code=500, detail="No dataset loaded")
    return {"variables": list(ds.variables.keys())}
