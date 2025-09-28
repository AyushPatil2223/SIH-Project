
from fastapi import FastAPI, UploadFile, File, HTTPException,Query


from fastapi import FastAPI, UploadFile, File, HTTPException, Query

>>>>>>> 91fa74f (Fix Homepag.jsx quotes and update Thred.jsx and backend)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import matplotlib.pyplot as plt
import tempfile
import xarray as xr
import numpy as np
import pandas as pd
import os
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas




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

# --- Existing endpoints ---
@app.get("/profiles")
def list_profiles():
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
        ds = xr.open_dataset(tmp_path)
        print("Variables in dataset:", list(ds.variables.keys()))

        # Extract variables
        depth = ds["n_levels"] if "n_levels" in ds.dims else None
        temperature = ds["temp_adjusted"] if "temp_adjusted" in ds.variables else None
        salinity = ds["psal_adjusted"] if "psal_adjusted" in ds.variables else None
        pressure = ds["pres_adjusted"] if "pres_adjusted" in ds.variables else None

        # Extract depth values (1D)
        depth_vals = list(range(ds.dims["n_levels"])) if "n_levels" in ds.dims else []

        # Extract first profile for temperature, salinity, pressure
        def extract_first_profile(var):
            if var is None:
                return []
            # If variable has n_prof dimension, select first profile
            if "n_prof" in var.dims:
                return var.isel(n_prof=0).values.tolist()
            return var.values.tolist()

        temperature_vals = extract_first_profile(temperature)
        salinity_vals = extract_first_profile(salinity)
        pressure_vals = extract_first_profile(pressure)

        # Ensure all arrays have same length
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


@app.get("/variables")
def list_variables():
    """List all variables in the loaded NetCDF file"""
    if ds is None:
        raise HTTPException(status_code=500, detail="No dataset loaded")
    return {"variables": list(ds.variables.keys())}

>>>>>>> 91fa74f (Fix Homepag.jsx quotes and update Thred.jsx and backend)
# --- PDF report generation ---
from fastapi import Body

@app.post("/generate_report")
def generate_report(data: dict = Body(...)):
    """
    Expects JSON body:
    {
        "depths": [...],
        "temps": [...],
        "max_temp": float,
        "min_temp": float,
        "lat": float,
        "lon": float
    }
    """
    depths = data.get("depths", [])
    temps = data.get("temps", [])
    max_temp = data.get("max_temp")
    min_temp = data.get("min_temp")
    lat = data.get("lat")
    lon = data.get("lon")

    if not depths or not temps or len(depths) != len(temps):
        raise HTTPException(status_code=400, detail="Depths and temps must be non-empty and of same length")

    # 1️⃣ Create plot
    plt.figure(figsize=(6,4))
    plt.plot(temps, depths, marker='o')
    plt.gca().invert_yaxis()
    plt.xlabel("Temperature (°C)")
    plt.ylabel("Depth (m)")
    plt.title(f"Temperature vs Depth at ({lat}, {lon})")

    buf = io.BytesIO()
    plt.savefig(buf, format='PNG')
    plt.close()
    buf.seek(0)

    # 2️⃣ Create PDF
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Ocean Data Report")

    # Metadata
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Latitude: {lat}, Longitude: {lon}")
    c.drawString(50, height - 100, f"Max Temp: {max_temp}°C, Min Temp: {min_temp}°C")

    # Draw plot
    c.drawImage(buf, 50, height - 400, width=500, height=300)

    c.showPage()
    c.save()
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=report.pdf"}
    )
