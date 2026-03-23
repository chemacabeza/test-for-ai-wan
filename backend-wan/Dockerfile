FROM python:3.10

WORKDIR /app

# The FFmpeg compiler is uniquely critical for `export_to_video` encoding mp4 arrays
RUN apt-get update && apt-get install -y ffmpeg build-essential libgl1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Pre-cache the model perfectly into the Docker layer so runtime container never hangs on internet checks!
# "damo-vilab/text-to-video-ms-1.7b" weighs roughly ~6.5GB, so this RUN layer will take some time!
RUN python -c "from diffusers import DiffusionPipeline; import torch; DiffusionPipeline.from_pretrained('damo-vilab/text-to-video-ms-1.7b', torch_dtype=torch.float32)"

COPY main.py .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
