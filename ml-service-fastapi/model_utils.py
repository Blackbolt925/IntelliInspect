import pandas as pd
import xgboost as xgb
import json
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, matthews_corrcoef, confusion_matrix
)
from datetime import datetime
import numpy as np

FEATURE_NAMES = []  # Global list used by simulation and FastAPI

# Filter dataframe rows between date range (inclusive)
def filter_by_date(df, start, end):
    df['date_only'] = df['Timestamp'].dt.date
    start_date = datetime.strptime(start, '%Y-%m-%d').date()
    end_date = datetime.strptime(end, '%Y-%m-%d').date()

    if end_date < datetime.max.date():
        end_date = (datetime.strptime(end, '%Y-%m-%d') + pd.Timedelta(days=1)).date()

    return df[(df['date_only'] >= start_date) & (df['date_only'] < end_date)]

# Compute and return evaluation metrics
def compute_metrics(y_true, y_pred):
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred), 4),
        "recall": round(recall_score(y_true, y_pred), 4),
        "f1_score": round(f1_score(y_true, y_pred), 4),
        "mcc": round(matthews_corrcoef(y_true, y_pred), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist()
    }

# Train XGBoost model and persist feature names
def train_xgb_model(df, trainStart, trainEnd, testStart, testEnd):
    global FEATURE_NAMES

    # Drop unnamed columns if they exist
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

    df_train = filter_by_date(df.copy(), trainStart, trainEnd)
    df_test = filter_by_date(df.copy(), testStart, testEnd)

    X_train = df_train.drop(columns=['Timestamp', 'date_only', 'Response'])
    y_train = df_train['Response']
    X_test = df_test.drop(columns=['Timestamp', 'date_only', 'Response'])
    y_test = df_test['Response']

    FEATURE_NAMES = X_train.columns.tolist()

    # ✅ Save features to disk so /simulate-row can reload even after restart
    with open("trained_features.json", "w") as f:
        json.dump(FEATURE_NAMES, f)

    # Handle class imbalance
    scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)

    # Train model
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

    evals_result = {}
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=100,
        evals=[(dtrain, 'train'), (dtest, 'test')],
        evals_result=evals_result,
        verbose_eval=False
    )

    # Evaluate
    y_pred = (model.predict(dtest) > 0.5).astype(int)
    metrics = compute_metrics(y_test, y_pred)
    metrics['train_loss'] = evals_result['train']['logloss']
    metrics['test_loss'] = evals_result['test']['logloss']
    metrics['train_accuracy'] = [round(1 - e, 4) for e in evals_result['train']['error']]
    metrics['test_accuracy'] = [round(1 - e, 4) for e in evals_result['test']['error']]

    return model, metrics

# Generator to stream predictions row-by-row for simulation
def simulate_with_model(model, df, simStart, simEnd):
    from time import sleep

    # Clean data
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
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
        sleep(0.1)  # Simulate delay for real-time effect
