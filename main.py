from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from PIL import Image
import torch
import numpy as np
from mangum import Mangum

def resize_image(img: Image.Image,
                 min_size = 720) -> Image.Image:

    size_original = img.size
    
    if min(size_original) < min_size:
        return img
    
    ratio = min_size / min(size_original)
    size_new = (int(ratio*size_original[0]),
                int(ratio*size_original[1]))
    
    return img.resize(size_new)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = torch.hub.load("ultralytics/yolov5", "yolov5n", pretrained=True)

class ImagePayload(BaseModel):
    image: str

@app.post("/detect")
async def detect(payload: ImagePayload):
    try:
        image_bytes = base64.b64decode(payload.image)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = model(img)
        result_img = Image.fromarray(results.render()[0])
        result_img = resize_image(result_img)
        buf = io.BytesIO()
        result_img.save(buf, format="JPEG")
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
        return {"image": encoded}
    except Exception as e:
        return {"error": str(e)}

handler = Mangum(app)