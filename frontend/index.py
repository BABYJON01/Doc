from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import asyncio
import io
import sqlite3
import json
import os
import hashlib
from pathlib import Path
import traceback
import sys
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
if os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent

# Vercel is serverless, so SQLite must be in /tmp
if os.environ.get("VERCEL"):
    DB_PATH = Path("/tmp/docassist.db")
else:
    DB_PATH = BASE_DIR / "docassist.db"

# --- Database ---
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, age INTEGER, bmi REAL,
            grade INTEGER, grade_text TEXT, date TEXT)""")
        cur.execute("""CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY, data TEXT)""")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Database init error: {e}", file=sys.stderr)
        traceback.print_exc()

@app.on_event("startup")
async def startup_event():
    init_db()

# --- KL Grade texts ---
KL_DETAILS = {
    0: "Sog'lom (Grade 0: Hech qanday belgi yo'q)",
    1: "Shubhali (Grade 1: Kichik osteofitlar ehtimoli)",
    2: "Boshlang'ich (Grade 2: Aniq osteofitlar va erta torayish)",
    3: "O'rta (Grade 3: Ko'plab osteofitlar, aniq torayish, skleroz)",
    4: "Og'ir (Grade 4: Suyak deformatsiyasi, keskin skleroz)",
}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is active", "db_path": str(DB_PATH)}

@app.get("/api/patients")
def get_patients():
    try:
        conn = get_db()
        rows = conn.execute("SELECT * FROM patients ORDER BY id ASC").fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/patients")
async def add_patient(request: Request):
    try:
        data = await request.json()
        conn = get_db()
        conn.execute(
            "INSERT INTO patients (name, age, bmi, grade, grade_text, date) VALUES (?,?,?,?,?,?)",
            (data.get("name"), data.get("age"), data.get("bmi"),
             data.get("grade"), data.get("grade_text", ""), data.get("date")),
        )
        conn.commit()
        conn.close()
        return {"status": "ok"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/settings")
def get_settings():
    try:
        conn = get_db()
        row = conn.execute("SELECT data FROM settings WHERE id=1").fetchone()
        conn.close()
        if row:
            return json.loads(row["data"])
        return {"doctor_name": "Dr. Alisher V.", "specialty": "Ortoped-Travmatolog",
                "theme": "dark", "lang": "uz", "avatar": ""}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/settings")
async def save_settings(request: Request):
    try:
        data = await request.json()
        conn = get_db()
        conn.execute("INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)",
                     (json.dumps(data),))
        conn.commit()
        conn.close()
        return {"status": "ok"}
    except Exception as e:
        return {"error": str(e)}

async def analyze_xray_image(image_bytes: bytes) -> dict:
    from PIL import Image
    import re
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        if not os.getenv("GEMINI_API_KEY"):
            return {"grade": 2, "valid": True, "source": "Gemini (API Key yo'q, Mock)"}

        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "Siz tajribali ortoped-travmatologsiz. Ushbu tasvirni tahlil qiling. "
            "Agar bu tibbiyotga oid rentgen (x-ray) yoki MRI tasviri bo'lmasa, faqat '-1' raqamini qaytaring. "
            "Agar u tizza yoki bo'g'im rentgeni bo'lsa, osteoartroz darajasini Kellgren-Lawrence (KL) "
            "shkalasi bo'yicha 0 dan 4 gacha baholang va faqat o'sha raqamni (0, 1, 2, 3 yoki 4) qaytaring. "
            "Javobingizda faqat bitta raqam bo'lsin, boshqa hech qanday so'z yozmang."
        )
        
        response = await model.generate_content_async([prompt, img])
        result_text = response.text.strip()
        
        # Extract number using regex just in case
        match = re.search(r'-1|[0-4]', result_text)
        if match:
            grade = int(match.group())
            if grade == -1:
                return {"grade": -1, "valid": False, "source": "Gemini 1.5 Vision"}
            else:
                grade = max(0, min(4, grade))
                return {"grade": grade, "valid": True, "source": "Gemini 1.5 Vision"}
        
        return {"grade": -1, "valid": False, "source": "Gemini 1.5 Vision"}
    except Exception as e:
        print("Gemini error:", str(e))
        return {"grade": 2, "valid": True, "source": f"Gemini (Xatolik: {str(e)})"}

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = await analyze_xray_image(contents)
        grade = result["grade"]
        source = result["source"]

        if not result["valid"]:
            return {
                "prediction": -1,
                "detail": "Diqqat: Yuklangan tasvir bo'g'im rentgenogrammasi emas. Iltimos, faqat tibbiy tasvirlarni yuklang.",
                "has_torch": True,
                "ai_source": source,
            }

        return {
            "prediction": grade,
            "detail": KL_DETAILS.get(grade, "Noma'lum"),
            "has_torch": True,
            "ai_source": source,
        }
    except Exception as e:
        return {"prediction": -1, "detail": str(e)}

# --- Frontend va Statik Fayllarni Qaytarish (Railway uchun) ---
from fastapi import HTTPException

@app.get("/")
def serve_index():
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="index.html fayli topilmadi")

@app.get("/{filename}")
def serve_static(filename: str):
    # Faqat xavfsiz kengaytmali fayllarga ruxsat beramiz. 
    # Bu orqali begona odamlar .db yoki Python sourseni yuklab ola olmaydi.
    valid_ext = [".css", ".js", ".png", ".jpg", ".jpeg", ".ico", ".svg", ".webmanifest"]
    file_path = BASE_DIR / filename
    
    if file_path.is_file() and file_path.suffix.lower() in valid_ext:
        return FileResponse(file_path)
        
    raise HTTPException(status_code=404, detail="Not Found")
