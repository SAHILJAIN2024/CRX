import joblib
import numpy as np
import os

# --- PATH CONFIGURATION ---
CURRENT_FILE_PATH = os.path.abspath(__file__)
BACKEND_DIR = os.path.dirname(CURRENT_FILE_PATH)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
MODELS_DIR = os.path.join(PROJECT_ROOT, "AI-Models", "trained_models")

TEXT_MODEL_PATH = os.path.join(MODELS_DIR, "text_classifier.pkl")

# --- LOAD TEXT MODEL ---
print("🔄 Loading Text Model...")
text_model = None

if os.path.exists(TEXT_MODEL_PATH):
    try:
        text_model = joblib.load(TEXT_MODEL_PATH)
        print("✅ Text Model Loaded!")
    except Exception as e:
        print(f"❌ Failed to load Text Model: {e}")
else:
    print(f"⚠️ Text Model not found at {TEXT_MODEL_PATH}")

def classify_waste(user_text=""):
    # Default "Failed" Response
    result = {
        "final_category": "Unknown",
        "confidence": 0.0,
        "source": "Unknown"
    }

    # Validation
    if not user_text or len(str(user_text).strip()) < 2:
        print("⚠️ Input too short.")
        return result

    # Prediction Logic
    if text_model:
        try:
            print(f"📝 Processing Text: {user_text}")
            
            # Get probabilities
            text_probs = text_model.predict_proba([user_text])[0]
            
            # Find highest probability
            text_class_index = np.argmax(text_probs)
            text_class = text_model.classes_[text_class_index]
            text_conf = float(text_probs[text_class_index])
            
            print(f"✅ Text Classified: {text_class} ({text_conf*100:.1f}%)")
            
            result["final_category"] = text_class
            result["confidence"] = round(text_conf * 100, 2)
            result["source"] = "User Description"
            
        except Exception as e:
            print(f"❌ TEXT ERROR: {e}")
    else:
        print("❌ Text Model is missing.")

    return result