from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load model and encoder
model = joblib.load("latex_allocation_model.pkl")
label_encoder = joblib.load("label_encoder.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    input_df = pd.DataFrame([data])

    prediction = model.predict(input_df)
    probabilities = model.predict_proba(input_df)

    predicted_label = label_encoder.inverse_transform(prediction)

    return jsonify({
        "recommended_process": predicted_label[0],
        "confidence": float(probabilities.max())
    })

if __name__ == "__main__":
    app.run(port=5001)