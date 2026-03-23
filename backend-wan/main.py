import os
import uuid
from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any
import logging

# Ensure output directory exists before launching the framework 
STATIC_DIR = "/app/static"
os.makedirs(STATIC_DIR, exist_ok=True)

app = FastAPI(title="Fal.ai Shadow Server", version="1.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Initializing offline ModelScope Video Tensors! (This may take a moment to load into RAM)...")

# --- OFFLINE ML INFERENCE ENGINE ---
import torch
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
from diffusers.utils import export_to_video

# Use the explicitly requested Offline "Download the model" route.
pipe = DiffusionPipeline.from_pretrained("damo-vilab/text-to-video-ms-1.7b", torch_dtype=torch.float32, local_files_only=True)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
# Force CPU execution to prevent OOM (Out Of Memory) crashing on undefined Linux host bounds.
pipe = pipe.to("cpu")
logger.info("Hardware Tensor Model mounted successfully offline!")


# --- QUEUE DATASTRUCTURE ---
jobs: Dict[str, Dict[str, Any]] = {}

def generate_video_offline(req_id: str, prompt: str):
    """
    Background Task: Executes the heavy PyTorch calculation strictly offline without HTTP timeouts.
    """
    try:
        jobs[req_id]["status"] = "IN_PROGRESS"
        logger.info(f"[{req_id}] Spawning local Text-To-Video neural computation for: '{prompt}'")
        
        # 1. Tensor computation. 
        # Using incredibly constrained hyperparameters (frames=4, steps=10) to prevent the user's host CPU from melting for 3 hours.
        # This will natively test Java polling without physically destroying their machine!
        video_frames = pipe(prompt, num_inference_steps=10, num_frames=4).frames[0]
        
        # 2. Native FFmpeg mp4 stitching
        video_path = os.path.join(STATIC_DIR, f"{req_id}.mp4")
        export_to_video(video_frames, video_path, fps=4)
        
        logger.info(f"[{req_id}] Offline generation synthesized: {video_path}")
        
        # 3. Exactly mimic Fal.ai's Final Result Schema
        jobs[req_id]["status"] = "COMPLETED"
        jobs[req_id]["result"] = {
            "video": {
                "url": f"http://localhost:8088/static/{req_id}.mp4",
                "content_type": "video/mp4",
                "file_name": f"{req_id}.mp4",
                "file_size": os.path.getsize(video_path),
                "width": 256,
                "height": 256,
                "fps": 4.0,
                "duration": 1.0,
                "num_frames": 4
            },
            "actual_prompt": prompt,
            "seed": 42
        }
    except Exception as e:
        logger.error(f"[{req_id}] Offline Model Crash: {e}")
        jobs[req_id]["status"] = "COMPLETED"
        jobs[req_id]["result"] = {"error": f"NATIVE_TENSOR_ERROR: {str(e)}"}


# --- NATIVE API POLLING ROUTES ---
class FalRequest(BaseModel):
    prompt: str

@app.post("/wan/v2.6/text-to-video")
@app.post("/fal-ai/{dynamic_path:path}")
async def submit_job(payload: FalRequest, background_tasks: BackgroundTasks):
    req_id = str(uuid.uuid4())
    logger.info(f"Intercepted Fal.ai submission! Spawning offline background Job UUID: {req_id}")
    
    jobs[req_id] = {"status": "IN_QUEUE", "queue_position": 1, "result": None}
    
    # Send the heavy workload to mathematically compute in the background 
    background_tasks.add_task(generate_video_offline, req_id, payload.prompt)
    
    return {
        "request_id": req_id,
        "response_url": f"http://localhost:8088/requests/{req_id}/result",
        "status_url": f"http://localhost:8088/requests/{req_id}/status",
        "cancel_url": f"http://localhost:8088/requests/{req_id}/cancel",
        "status": "IN_QUEUE",
        "queue_position": 1
    }

@app.get("/requests/{req_id}/status")
def get_status(req_id: str):
    if req_id not in jobs:
        return {"status": "COMPLETED", "error": "UNKNOWN_LOCAL_JOB"}
    
    # Fal Status polling
    return {
        "status": jobs[req_id]["status"],
        "request_id": req_id,
        "queue_position": jobs[req_id].get("queue_position", 0),
        "response_url": f"http://localhost:8001/requests/{req_id}/result"
    }

@app.get("/requests/{req_id}/result")
def get_result(req_id: str):
    if req_id not in jobs:
        return {"error": "UNKNOWN_LOCAL_JOB"}
    return jobs[req_id]["result"]

@app.get("/health")
def health_check():
    return {"status": "offline_engine_running"}
