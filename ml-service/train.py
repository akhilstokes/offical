import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load dataset
data = pd.read_csv("latex_dataset.csv")

X = data[["drc_percent", "impurity_percent", "pH", "storage_days"]]
y = data["production_stage"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = DecisionTreeClassifier(max_depth=4)
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)
print("Model Accuracy:", accuracy_score(y_test, predictions))

# Save model
joblib.dump(model, "latex_stage_model.pkl")

print("Model saved successfully!")
