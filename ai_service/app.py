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
import sys
import unicodedata
import json 

from model_config import MODEL_CONFIGS
from calc_nutrients import NutritionRecommender

# Import kiến trúc mạng
try:
    from model.lsnet import lsnet_t_distill
except ImportError:
    try:
        from model.lsnet import lsnet_b
    except ImportError:
         print("Critical: Không tìm thấy kiến trúc lsnet")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
LOADED_MODELS = {}


def get_food_data_local():
    logger.info("Đang tải Menu món ăn từ file JSON local...")
    try:
        # Đọc file food_data.json
        if not os.path.exists("food_data.json"):
            logger.error("Không tìm thấy file 'food_data.json'. Hãy chạy export_data.py trước!")
            return []
            
        with open("food_data.json", "r", encoding="utf-8") as f:
            food_list = json.load(f)
            
        # Thêm trường search_norm để tìm kiếm
        for item in food_list:
            item["search_norm"] = str(item.get('name', '')).lower()
            
        logger.info(f"Đã tải {len(food_list)} món ăn.")
        return food_list
    except Exception as e:
        logger.error(f"Lỗi đọc file JSON: {e}")
        return []

# Khởi tạo dữ liệu
dynamic_food_data = get_food_data_local()
recommender = NutritionRecommender(dynamic_food_data)

def find_nutrition_by_name(pred_name):
    if not dynamic_food_data: return None
    pred_lower = pred_name.lower().strip()
    
    def remove_accents(input_str):
        nfkd_form = unicodedata.normalize('NFKD', input_str)
        return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

    pred_no_accent = remove_accents(pred_lower)

    for food in dynamic_food_data:
        food_name_lower = food['name'].lower()
        if food_name_lower == pred_lower: return food
        if remove_accents(food_name_lower) == pred_no_accent: return food
    return None


preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def download_file_if_missing(url, path):
    if not os.path.exists(path):
        if not url: return
        os.makedirs(os.path.dirname(path), exist_ok=True)
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as e:
            logger.error(f"Download failed: {e}")

def get_model(model_id):
    config = next((item for item in MODEL_CONFIGS if item["id"] == model_id), None)
    if not config: raise ValueError(f"Unknown model ID: {model_id}")

    if model_id not in LOADED_MODELS:
        logger.info(f"Loading model: {config['name']}...")
        download_file_if_missing(config.get('weights_url'), config['weights_path'])
        download_file_if_missing(config.get('classes_url'), config['classes_path'])
        
        classes = ["Unknown"]
        if os.path.exists(config['classes_path']):
            with open(config['classes_path'], "r", encoding="utf-8") as f:
                classes = [line.strip() for line in f.readlines()]

        model = lsnet_t_distill(num_classes=len(classes))
        if os.path.exists(config['weights_path']):
            try:
                state_dict = torch.load(config['weights_path'], map_location=DEVICE)
                model.load_state_dict(state_dict, strict=False)
            except Exception as e:
                logger.error(f"Lỗi load state_dict: {e}")
        
        model.to(DEVICE)
        model.eval()
        LOADED_MODELS[model_id] = {'model': model, 'classes': classes}
        
    return LOADED_MODELS[model_id]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        default_model_id = MODEL_CONFIGS[0]['id'] 
        if 'file' not in request.files and 'image' not in request.json:
             return jsonify({'success': False, 'message': 'No image provided'}), 400

        if 'file' in request.files:
            file = request.files['file']
            image_bytes = file.read()
        else:
            image_data = request.json['image']
            if "," in image_data: image_data = image_data.split(",")[1]
            image_bytes = base64.b64decode(image_data)

        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = preprocess(image).unsqueeze(0).to(DEVICE)
        model_data = get_model(default_model_id)
        model = model_data['model']
        classes = model_data['classes']

        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            
        top_prob, top_id = torch.topk(probabilities, 3)
        single_probs = top_prob[0]
        single_ids = top_id[0]
        
        predictions = []
        for i in range(len(single_probs)):
            idx = single_ids[i].item()
            score = single_probs[i].item()
            label = classes[idx] if idx < len(classes) else f"Class {idx}"
            
            food_info = find_nutrition_by_name(label)
            
            pred_obj = {
                'name': label,
                'confidence': float(score),
                'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0, 'image': ''
            }
            
            if food_info:
                pred_obj['name'] = food_info['name']
                pred_obj['calories'] = food_info.get('Energy', 0)
                pred_obj['protein'] = food_info.get('Protein', 0)
                pred_obj['fat'] = food_info.get('Fat', 0)
                pred_obj['carbs'] = food_info.get('Carbohydrate', 0)
                pred_obj['image'] = food_info.get('image', '')
            
            predictions.append(pred_obj)

        return jsonify({
            'success': True,
            'predictions': predictions,
            'bestMatch': predictions[0]
        })

    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        user_profile = data.get('userProfile', {})
        eaten_today = data.get('eatenToday', None)
        recommendations = recommender.get_recommendations(user_profile, eaten_today)
        return jsonify({'success': True, 'recommendations': recommendations})
    except Exception as e:
        logger.error(f"Recommendation Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'online', 'data_source': 'local_json', 'menu_size': len(dynamic_food_data)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
