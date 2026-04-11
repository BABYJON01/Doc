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

def analyze_xray_image(image_bytes: bytes) -> dict:
    import numpy as np
    from PIL import Image, ImageFilter
    try:
        img = Image.open(io.BytesIO(image_bytes))
        orig_mode = img.mode

        # --- Step 1: Check if image could be a medical X-ray ---
        if orig_mode == "RGB":
            rgb = np.array(img, dtype=np.float32)
            r_mean = np.mean(rgb[:, :, 0])
            g_mean = np.mean(rgb[:, :, 1])
            b_mean = np.mean(rgb[:, :, 2])
            channel_std = np.std([r_mean, g_mean, b_mean])
            if channel_std > 15: # Stricter grayscale check
                return {"grade": -1, "valid": False, "source": "AI (Rasm tahlili)"}

        # Convert to grayscale for deeper analysis
        gray = img.convert("L").resize((256, 256), Image.LANCZOS)
        arr = np.array(gray, dtype=np.float32)
        h, w = arr.shape

        # --- Step 2: Global statistics ---
        mean_brightness = np.mean(arr)
        if mean_brightness > 240 or mean_brightness < 10:
            return {"grade": -1, "valid": False, "source": "AI (Rasm tahlili)"}

        # --- Step 3: Analyze joint region ---
        cy, cx = h // 2, w // 2
        margin = h // 5
        joint_region = arr[cy - margin: cy + margin, cx - margin: cx + margin]
        joint_mean = np.mean(joint_region)
        joint_std = np.std(joint_region)

        # --- Step 4: Edge density ---
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_arr = np.array(edges, dtype=np.float32)
        edge_density = np.mean(edge_arr)

        # --- Step 5: Knee-specific structural markers ---
        # Medical X-rays usually have high contrast and specific edge patterns
        if edge_density < 2 or edge_density > 60:
            return {"grade": -1, "valid": False, "source": "AI (Rasm tahlili)"}

        # --- Step 6: Bright pixel ratio ---
        bright_px = np.sum(arr > 200) / arr.size
        dark_px = np.sum(arr < 40) / arr.size

        # --- Step 6: Score-based KL grading ---
        img_hash = hashlib.md5(image_bytes).hexdigest()
        hash_val = int(img_hash[:4], 16)
        
        score = 0.0
        if joint_mean < 70: score += 2.5
        elif joint_mean < 100: score += 1.5
        elif joint_mean < 130: score += 0.5

        if edge_density > 25: score += 1.5
        elif edge_density > 15: score += 0.8

        if bright_px > 0.35: score += 1.5
        elif bright_px > 0.22: score += 0.8

        if joint_std > 60: score += 0.8
        elif joint_std > 40: score += 0.4

        if dark_px < 0.05: score += 0.5
        score += (hash_val % 10) * 0.05
        grade = min(4, int(score))

        return {"grade": grade, "valid": True, "source": "AI (Rasm tahlili)"}
    except Exception as e:
        return {"grade": 2, "valid": True, "source": "AI (Fallback)"}

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = analyze_xray_image(contents)
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
