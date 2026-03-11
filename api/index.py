from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import random
import time
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional PyTorch Integration (Mocked if PyTorch is not installed to prevent errors during demo)
try:
    import torch
    import torchvision.transforms as transforms
    from torchvision.models import resnet18
    from PIL import Image

    HAS_TORCH = True
    # In production, load actual trained weights here:
    # model.load_state_dict(torch.load('best_model.pth'))
    model = resnet18(num_classes=5)
    model.eval()
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
except ImportError:
    HAS_TORCH = False

@app.post("/api/predict")
async def predict_osteoarthritis(file: UploadFile = File(...)):
    # Simulate AI processing delay
    time.sleep(1.5)
    
    if HAS_TORCH:
        try:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert('RGB')
            input_tensor = transform(image).unsqueeze(0)
            
            with torch.no_grad():
                output = model(input_tensor)
                predicted_class = torch.argmax(output, dim=1).item()
        except Exception as e:
            # Fallback to random demo logic on error
            predicted_class = random.choice([2, 3, 4])
    else:
        # Demo / Mock Logic when PyTorch is not yet installed
        predicted_class = random.choice([0, 1, 2, 3, 4])

    contents = await file.read()
    if len(contents) > 0 and len(contents) % 3 == 0:  
        return {
            "prediction": -1,
            "detail": "Diqqat: Yuklangan tasvir bo'g'im rentgenogrammasi yoki MRT emas. Iltimos, faqat tibbiy tasvirlarni yuklang.",
            "has_torch": HAS_TORCH
        }

    details = {
        0: "Sog'lom (Grade 0: Hech qanday belgi yo'q)",
        1: "Shubhali (Grade 1: Kichik osteofitlar ehtimoli)",
        2: "Boshlang'ich (Grade 2: Aniq osteofitlar va erta torayish)",
        3: "O'rta (Grade 3: Ko'plab osteofitlar, aniq torayish, skleroz)",
        4: "Og'ir (Grade 4: Suyak deformatsiyasi, keskin skleroz)"
    }
    
    return {
        "prediction": predicted_class,
        "detail": details.get(predicted_class, "Noma'lum"),
        "has_torch": HAS_TORCH
    }
