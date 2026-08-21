from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from supabase import Client

app = FastAPI(title="OrbitGuard AI API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to OrbitGuard AI API"}

@app.get("/api/health/db")
def health_check_db(db: Client = Depends(get_db)):
    try:
        return {"status": "ok", "supabase_url": str(db.supabase_url)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.get("/api/debris/live")
def get_live_debris():
    import httpx
    from sgp4.api import Satrec, jday
    from datetime import datetime, timezone
    from config import settings
    
    login_url = "https://www.space-track.org/ajaxauth/login"
    query_url = "https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_TYPE/DEBRIS/orderby/NORAD_CAT_ID/format/json/limit/50"
    
    with httpx.Client() as client:
        # Authenticate
        resp = client.post(login_url, data={'identity': settings.SPACE_TRACK_USERNAME, 'password': settings.SPACE_TRACK_PASSWORD})
        if resp.status_code != 200:
            return {"error": "Authentication failed"}
            
        # Fetch Data
        resp = client.get(query_url)
        if resp.status_code != 200:
            return {"error": "Failed to fetch debris data"}
            
        data = resp.json()
        
        results = []
        now = datetime.now(timezone.utc)
        jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)
        
        for item in data:
            try:
                satrec = Satrec.twoline2rv(item['TLE_LINE1'], item['TLE_LINE2'])
                e, r, v = satrec.sgp4(jd, fr)
                if e == 0:  # No error in calculation
                    results.append({
                        "id": item['NORAD_CAT_ID'],
                        "name": item['OBJECT_NAME'],
                        "x": r[0] / 1000, # Scale down so 1 unit = 1000 km (Earth Radius = 6.371 in frontend)
                        "y": r[2] / 1000, # Swap Y and Z for Three.js (Three.js Y is UP, SGP4 Z is UP)
                        "z": -r[1] / 1000 # Invert SGP4 Y to get Three.js Z
                    })
            except Exception:
                pass
                
        return {"debris": results}
