import joblib
import numpy as np
import os
import warnings

# Suppress the specific warning if it persists (Optional, but cleaner output)
warnings.filterwarnings("ignore", category=UserWarning)

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "trained_models", "knn_recommender.pkl")

print(f"Loading Bin Recommender from: {MODEL_PATH}")

# --- LOAD MODELS ---
try:
    model_registry = joblib.load(MODEL_PATH)
except FileNotFoundError:
    print("❌ Error: KNN Model not found. Run train_knn_model.py first.")
    model_registry = {}
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model_registry = {}

def find_nearest_bin(category, user_lat, user_long):
    """
    Finds the nearest bin that accepts the specific 'category'.
    """
    # 1. Check if we have a model for this category
    if category not in model_registry:
        print(f"⚠️ Warning: No model found for category '{category}'. Using default.")
        return {
            "error": "No bins found for this category",
            "bin_name": "General Central Dump",
            "location": {"lat": 28.6139, "lng": 77.2090} # Default fallback
        }

    # 2. Get the specific model & data
    registry_entry = model_registry[category]
    knn_model = registry_entry["model"]
    bin_data = registry_entry["data"]

    # 3. Prepare User Location (Convert to Radians for Haversine)
    user_coords = np.radians([[user_lat, user_long]])

    # 4. Find Nearest Neighbor
    try:
        distances, indices = knn_model.kneighbors(user_coords)
        nearest_idx = indices[0][0]
        nearest_bin = bin_data.iloc[nearest_idx]
        
        # 5. Return Result
        return {
            "bin_id": int(nearest_bin['bin_id']),
            "name": nearest_bin['address'],
            "location": {
                "lat": float(nearest_bin['latitude']),
                "lng": float(nearest_bin['longitude'])
            },
            "distance_km": round(distances[0][0] * 6371, 2)
        }
    except Exception as e:
        return {"error": f"Calculation failed: {str(e)}"}

# --- TEST CODE (THIS PART WAS MISSING OR NOT RUNNING) ---
if __name__ == "__main__":
    print("\n--- 🧪 STARTING TEST RUN ---")
    
    # 1. Define a test user location (e.g., Connaught Place, Delhi)
    test_lat = 28.6304
    test_long = 77.2177
    
    # 2. Define a test category
    test_category = "Hazardous_Lamps"
    
    print(f"📍 User Location: {test_lat}, {test_long}")
    print(f"🔍 Searching for bin type: '{test_category}'")

    # 3. Call the function
    result = find_nearest_bin(test_category, test_lat, test_long)

    # 4. Print the result
    print("\n✅ RESULT FOUND:")
    print(result)