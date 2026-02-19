from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load("latex_stage_model.pkl")

# ✅ Add this
@app.route("/")
def home():
    return "ML Service Running"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    try:
        features = np.array([[
            float(data["drc_percent"]),
            float(data["impurity_percent"]),
            float(data["pH"]),
            float(data["storage_days"])
        ]])

        prediction = model.predict(features)

        return jsonify({
            "production_stage": prediction[0]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
