import io
import base64
import logging
import numpy as np
from PIL import Image
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from ultralytics import YOLO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Object Detection API",
    description="YOLO-based object detection service",
    version="1.0.0"
)

# Add CORS middleware for S3 website
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the model
model = None

def load_model():
    """Load YOLO model (called once on startup)"""
    global model
    try:
        # Use YOLOv8n (nano) for faster inference, force CPU
        model = YOLO('yolov8n.pt')
        # Force model to use CPU only
        model.to('cpu')
        logger.info("YOLO model loaded successfully on CPU")
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        raise e

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Object Detection API is running", "model_loaded": model is not None}

class ImageRequest(BaseModel):
    image: str  # base64 encoded image

@app.post("/detect")
async def detect_objects(request: ImageRequest):
    """
    Detect objects in base64 encoded image and return image with bounding boxes
    """
    try:
        # Decode base64 image
        try:
            image_bytes = base64.b64decode(request.image)
            logger.info(f"Decoded {len(image_bytes)} bytes from base64")
        except Exception as e:
            logger.error(f"Base64 decode error: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")
        
        # Check if empty
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Image data is empty after decoding")
        
        # Open image with PIL
        try:
            image_buffer = io.BytesIO(image_bytes)
            image = Image.open(image_buffer)
            # Verify the image
            image.verify()
            
            # Re-open since verify closes it
            image_buffer.seek(0)
            image = Image.open(image_buffer)
            logger.info(f"Successfully opened image: {image.size}, mode: {image.mode}")
            
        except Exception as e:
            logger.error(f"PIL error: {e}")
            raise HTTPException(status_code=400, detail=f"Cannot process image: {str(e)}")
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array for YOLO
        image_array = np.array(image)
        logger.info(f"Image array shape: {image_array.shape}")
        
        # Run YOLO inference
        logger.info("Running YOLO inference...")
        results = model(image_array, device='cpu')
        
        # Get annotated image
        result_img = Image.fromarray(results[0].plot())
        
        # Convert back to base64
        output_buffer = io.BytesIO()
        result_img.save(output_buffer, format='JPEG', quality=90)
        output_bytes = output_buffer.getvalue()
        encoded_result = base64.b64encode(output_bytes).decode('utf-8')
        
        logger.info("Object detection completed successfully")
        return {"image": encoded_result}

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check for load balancer"""
    return {"status": "healthy", "model_loaded": model is not None}

# Lambda handler
handler = Mangum(app)