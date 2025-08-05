import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix
)
from schemas import ModelMetricsResponse

def train_and_evaluate_model():
    # Dummy data for now
    X, y = make_classification(n_samples=1000, n_features=20, n_classes=2, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train classifier (replace with XGBoost/LightGBM later)
    clf = RandomForestClassifier()
    clf.fit(X_train, y_train)

    # Predictions
    y_pred = clf.predict(X_test)

    # Evaluation metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    # Simulate training metrics for plotting (replace with real values if using XGBoost)
    epochs = list(range(1, 11))
    acc_over_epochs = np.linspace(0.6, acc, num=10).tolist()
    loss_over_epochs = np.linspace(1.0, 0.2, num=10).tolist()

    return ModelMetricsResponse(
        accuracy=round(acc * 100, 2),
        precision=round(prec * 100, 2),
        recall=round(rec * 100, 2),
        f1_score=round(f1 * 100, 2),
        training_accuracy=acc_over_epochs,
        training_loss=loss_over_epochs,
        confusion_matrix={"TP": int(tp), "TN": int(tn), "FP": int(fp), "FN": int(fn)}
    )
