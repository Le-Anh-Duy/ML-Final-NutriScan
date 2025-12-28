from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
from torchvision import transforms
from PIL import Image
import io
import logging
import base64
import urllib.request
from model_config import MODEL_CONFIGS

# --- SETUP ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app) # Allow React Frontend to connect

# Device Configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
LOADED_MODELS = {}

# --- PREPROCESSING ---
# Standard ImageNet normalization
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                         std=[0.229, 0.224, 0.225]),
])

# --- HELPER FUNCTIONS ---
def download_file_if_missing(url, path):
    if not url: return
    if not os.path.exists(path):
        logger.info(f"Downloading {path}...")
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            urllib.request.urlretrieve(url, path)
        except Exception as e:
            logger.error(f"Download failed: {e}")

def load_models():
    """Load model into memory on startup"""
    logger.info(f"Loading models on {DEVICE}...")
    
    for config in MODEL_CONFIGS:
        try:
            # 1. Ensure files exist
            download_file_if_missing(config.get("classes_url"), config["classes_path"])
            download_file_if_missing(config.get("weights_url"), config["weights_path"])

            # 2. Load Class Names
            if not os.path.exists(config["classes_path"]):
                logger.error(f"Classes file missing: {config['classes_path']}")
                continue
                
            with open(config["classes_path"], "r", encoding="utf-8") as f:
                classes = [s.strip() for s in f.readlines()]

            # 3. Load Model Architecture
            if config["arch_fn"] is None:
                logger.error(f"Model architecture not found for {config['id']}")
                continue
                
            model = config["arch_fn"](num_classes=config["num_classes"], pretrained=False)
            
            # 4. Load Weights
            if os.path.exists(config["weights_path"]):
                checkpoint = torch.load(config["weights_path"], map_location=DEVICE)
                state_dict = checkpoint['model'] if 'model' in checkpoint else checkpoint
                model.load_state_dict(state_dict, strict=False)
                model.to(DEVICE)
                model.eval()
            else:
                logger.error(f"Weights file missing: {config['weights_path']}")
                continue

            # 5. Save to Global Dictionary
            LOADED_MODELS[config["id"]] = {
                "model": model, 
                "classes": classes
            }
            logger.info(f"✅ Successfully loaded: {config['name']}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load {config['id']}: {e}")

# Initialize models immediately
load_models()

# --- API ENDPOINTS ---

@app.route('/predict', methods=['POST'])
def predict():
    if not LOADED_MODELS:
        return jsonify({'success': False, 'message': 'AI Model not loaded'}), 503

    try:
        data = request.json
        image_data = data.get('image', '')
        
        if not image_data:
            return jsonify({'success': False, 'message': 'No image data provided'}), 400

        # 1. Decode Base64 Image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # 2. Select Model (Default to the first one)
        model_info = list(LOADED_MODELS.values())[0]
        model = model_info["model"]
        classes = model_info["classes"]

        # 3. Inference
        input_tensor = preprocess(image).unsqueeze(0).to(DEVICE)
        
        with torch.no_grad():
            output = model(input_tensor)
        
        # 4. Process Results
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        top5_prob, top5_id = torch.topk(probabilities, 5)

        predictions = []
        for i in range(top5_prob.size(0)):
            idx = top5_id[i].item()
            score = top5_prob[i].item()
            
            label = classes[idx] if idx < len(classes) else str(idx)
            
            predictions.append({
                'name': label,
                'confidence': float(score)
            })

        return jsonify({
            'success': True,
            'predictions': predictions,
            'bestMatch': predictions[0]
        })

    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'models_loaded': list(LOADED_MODELS.keys())
    })

if __name__ == '__main__':
    print("🚀 AI Server starting on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)