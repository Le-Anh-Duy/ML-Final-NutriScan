import os
import sys

# Get the current directory of this file
current_dir = os.path.dirname(os.path.abspath(__file__))

# Import the architecture from your local 'model' folder
try:
    # Try importing the specific function used in training
    from model.lsnet import lsnet_b
except ImportError:
    # Fallback: Use standard tiny if distill function isn't named explicitly
    try:
        from model.lsnet import lsnet_t as lsnet_t_distill
    except ImportError as e:
        print(f"CRITICAL ERROR: Could not import model.lsnet. {e}")
        lsnet_t_distill = None

MODEL_CONFIGS = [
    {
        "id": "lsnet_b",
        "type": "classification",
        "name": "LSNet Base (Vietnamese Food)",
        
        # Paths to your copied files
        "weights_path": None,
        "classes_path": os.path.join(current_dir, "pretrained", "vietnamese_food_classes_103.txt"),
        
        # Backup URLs (Auto-download if files are missing)
        "weights_url": "https://huggingface.co/giahuy4205/lsnet-finetuned/resolve/main/lsnet_b_finetuned.pth?download=true",
        # "classes_url": "https://huggingface.co/MatchaMacchiato/LSNet_VietnameseFood/resolve/main/vietnamese_food_classes.txt?download=true",
        
        "num_classes": 103, # Change to 103 if using the larger dataset
        "arch_fn": lsnet_b
    }
]
