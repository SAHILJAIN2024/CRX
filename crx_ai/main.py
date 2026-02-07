from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# --- 1. SETUP PATHS TO IMPORT SIBLING MODULES ---
# We need to import 'bin_recommender' from the 'AI-Models' folder.
# 'Backend' is current folder. Parent is 'IIT-BHU'.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir) # The 'IIT-BHU' folder
ai_models_dir = os.path.join(parent_dir, 'AI-Models')

# Add AI-Models to Python path so we can import bin_recommender
sys.path.append(ai_models_dir)

# Now we can import the modules
try:
    from waste_logic import classify_waste  # From current Backend folder
    from bin_recommender import find_nearest_bin # From AI-Models folder
    print("✅ Successfully imported AI modules.")
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure bin_recommender.py is in AI-Models and waste_logic.py is in Backend.")

# --- 2. INITIALIZE FASTAPI ---
app = FastAPI(title="Smart E-Waste System (Text Only)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. API ENDPOINTS ---
@app.get("/")
def home():
    return {"message": "♻️ Smart E-Waste Backend is Live (Text Mode)!"}

@app.post("/analyze")
async def analyze_waste(
    text: str = Form(...),              # REQUIRED: User must type something
    lat: float = Form(default=28.6139), # Default to Delhi if no GPS
    lng: float = Form(default=77.2090)
):
    print(f"📝 Received Text: {text}")

    # 1. Validation
    if not text or len(text.strip()) == 0:
        return {"status": "error", "message": "Please provide a description."}

    try:
        # 2. Classify (Text Only)
        # We pass the text to your new waste_logic.py
        classification_result = classify_waste(user_text=text)
        
        detected_category = classification_result["final_category"]
        print(f"✅ Classified as: {detected_category}")
        
        # 3. Handle Unknowns
        # If the model is unsure, we stop here and ask for more info
        if detected_category == "Unknown":
            return {
                "status": "error", 
                "message": "Could not identify waste. Try a more specific description (e.g., 'swollen battery', 'broken screen')."
            }

        # 4. Get Recommendation (KNN)
        # We use the detected category to find the nearest bin
        print(f"📍 Finding bin for {detected_category} near {lat}, {lng}...")
        recommendation_result = find_nearest_bin(detected_category, lat, lng)

        # 5. Return Final JSON
        return {
            "status": "success",
            "classification": classification_result,
            "recommendation": recommendation_result
        }

    except Exception as e:
        print(f"❌ Server Error: {e}")
        return {"status": "error", "message": str(e)}