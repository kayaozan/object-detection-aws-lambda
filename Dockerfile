# Use Amazon Linux 2 slim image for smaller size
FROM public.ecr.aws/lambda/python:3.11

# Install only essential system dependencies
RUN yum update -y && \
    yum install -y \
    gcc libglvnd-glx \
    && yum clean all \
    && rm -rf /var/cache/yum

# Set environment variables for CPU-only inference
ENV TORCH_HOME=/tmp
ENV YOLO_CONFIG_DIR=/tmp
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

# Install Python dependencies with CPU-only PyTorch
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install dependencies with CPU-only PyTorch
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py ${LAMBDA_TASK_ROOT}/

# Pre-download YOLO model to reduce cold start time
RUN python -c "from ultralytics import YOLO; \
    model = YOLO('yolov8n.pt'); model.to('cpu')"

# Remove unnecessary files to reduce image size
RUN find /var/lang/lib/python3.11/site-packages \
    -name "*.pyc" -delete && \
    find /var/lang/lib/python3.11/site-packages \
    -name "__pycache__" -exec rm -rf {} + || true

# Set the CMD to your handler
CMD ["app.handler"]