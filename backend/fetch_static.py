import httpx
import json
import os
from sgp4.api import Satrec, jday
from datetime import datetime, timezone

username = "cipheroot@proton.me"
password = "ijustwannahearu"

def fetch_data():
    login_url = "https://www.space-track.org/ajaxauth/login"
    query_url = "https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_TYPE/DEBRIS/orderby/NORAD_CAT_ID/format/json/limit/50"
    
    with httpx.Client() as client:
        # 1. Login
        resp = client.post(login_url, data={'identity': username, 'password': password})
        
        # 2. Query
        resp = client.get(query_url)
        data = resp.json()
        
        results = []
        now = datetime.now(timezone.utc)
        jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)
        
        for item in data:
            try:
                satrec = Satrec.twoline2rv(item['TLE_LINE1'], item['TLE_LINE2'])
                e, r, v = satrec.sgp4(jd, fr)
                if e == 0:  
                    results.append({
                        "id": item['NORAD_CAT_ID'],
                        "name": item['OBJECT_NAME'],
                        "status": "Inactive",
                        "x": r[0] / 1000, 
                        "y": r[2] / 1000, 
                        "z": -r[1] / 1000 
                    })
            except Exception:
                pass
                
        output_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "space-track.json")
        with open(output_path, "w") as f:
            json.dump({"debris": results}, f, indent=2)
            
        print("Successfully saved space-track.json!")

if __name__ == '__main__':
    fetch_data()
