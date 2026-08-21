import httpx
from sgp4.api import Satrec, jday
from datetime import datetime, timezone

username = "cipheroot@proton.me"
password = "ijustwannahearu"

def fetch_data():
    login_url = "https://www.space-track.org/ajaxauth/login"
    query_url = "https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_TYPE/DEBRIS/orderby/NORAD_CAT_ID/format/json/limit/5"
    
    with httpx.Client() as client:
        # 1. Login
        resp = client.post(login_url, data={'identity': username, 'password': password})
        print("Login status:", resp.status_code)
        
        # 2. Query
        resp = client.get(query_url)
        print("Query status:", resp.status_code)
        
        data = resp.json()
        print("Got", len(data), "records")
        for item in data:
            satrec = Satrec.twoline2rv(item['TLE_LINE1'], item['TLE_LINE2'])
            now = datetime.now(timezone.utc)
            jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)
            e, r, v = satrec.sgp4(jd, fr)
            print(f"Debris {item['OBJECT_NAME']}: {r}")

if __name__ == '__main__':
    fetch_data()
