import pymongo
import sys

def check_mongo():
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        dbs = client.list_database_names()
        print("Databases found:", dbs)
        
        for db_name in dbs:
            if db_name in ['admin', 'config', 'local']:
                continue
            print(f"\n--- Database: {db_name} ---")
            db = client[db_name]
            collections = db.list_collection_names()
            for coll_name in collections:
                count = db[coll_name].count_documents({})
                print(f"Collection: {coll_name} | Documents: {count}")
                
    except Exception as e:
        print("Could not connect to MongoDB:", str(e))

if __name__ == '__main__':
    check_mongo()
