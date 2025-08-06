import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, matthews_corrcoef, confusion_matrix
)
from datetime import datetime
import io
FEATURE_NAMES = []

def filter_by_date(df, start, end):
    df['date_only'] = df['Timestamp'].dt.date
    start_date = datetime.strptime(start, '%Y-%m-%d').date()
    # Add one day to end date to include full day
    end_date = datetime.strptime(end, '%Y-%m-%d').date()
    if end_date < datetime.max.date():
        end_date = (datetime.strptime(end, '%Y-%m-%d') + pd.Timedelta(days=1)).date()
    return df[
        (df['date_only'] >= start_date) &
        (df['date_only'] < end_date)  # Changed to < since we added a day
    ]

def compute_metrics(y_true, y_pred):
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred), 4),
        "recall": round(recall_score(y_true, y_pred), 4),
        "f1_score": round(f1_score(y_true, y_pred), 4),
        "mcc": round(matthews_corrcoef(y_true, y_pred), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist()
    }

def train_xgb_model(df, trainStart, trainEnd, testStart, testEnd, evals_result):
    df_train = filter_by_date(df.copy(), trainStart, trainEnd)
    df_test = filter_by_date(df.copy(), testStart, testEnd)

    X_train = df_train.drop(columns=['Timestamp', 'date_only', 'Response'])
    y_train = df_train['Response']
    X_test = df_test.drop(columns=['Timestamp', 'date_only', 'Response'])
    y_test = df_test['Response']

    global FEATURE_NAMES
    FEATURE_NAMES = X_train.columns.tolist()

    scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)

    dtrain = xgb.DMatrix(X_train, label=y_train)
    dtest = xgb.DMatrix(X_test, label=y_test)
    params = {
        'objective': 'binary:logistic',
        'eval_metric': ['logloss', 'error'],
        'learning_rate': 0.1,
        'max_depth': 6,
        'tree_method': 'hist',
        'scale_pos_weight': scale_pos_weight
    }

    model = xgb.train(
        params,
        dtrain,
        num_boost_round=100,
        evals=[(dtrain, 'train'), (dtest, 'test')],
        evals_result=evals_result,
        verbose_eval=False
    )

    y_pred = (model.predict(dtest) > 0.5).astype(int)
    metrics = compute_metrics(y_test, y_pred)
    metrics['train_loss'] = evals_result['train']['logloss']
    metrics['test_loss'] = evals_result['test']['logloss']
    metrics['train_accuracy'] = [round(1 - e, 4) for e in evals_result['train']['error']]
    metrics['test_accuracy'] = [round(1 - e, 4) for e in evals_result['test']['error']]
    return model, metrics

def simulate_with_model(model, df, simStart, simEnd):
    from time import sleep
    df_sim = filter_by_date(df, simStart, simEnd)
    X_sim = df_sim.drop(columns=['Timestamp', 'date_only', 'Response'])
    dsim = xgb.DMatrix(X_sim)
    preds = model.predict(dsim)
    for i, row in df_sim.iterrows():
        prob = float(preds[i])
        result = {
            "index": int(i),
            "timestamp": row['Timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
            "actual": int(row['Response']),
            "predicted": int(prob > 0.5),
            "probability": round(prob, 4)
        }
        yield result
        sleep(0.1)
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
