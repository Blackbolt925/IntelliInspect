from fastapi import Request
from pydantic import BaseModel
from model_utils import FEATURE_NAMES

# Define a Pydantic model for a single row (adjust fields as needed)
class SimulationRow(BaseModel):
    Timestamp: str
    class Config:
        extra = "allow"  # Allow any additional fields from CSV

import math
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import io
import json
import xgboost as xgb
from model_utils import train_xgb_model, simulate_with_model

app = FastAPI()
model = None
evals_result = {}

@app.post("/train-model")
async def train_model(
    trainStart: str = Form(...),
    trainEnd: str = Form(...),
    testStart: str = Form(...),
    testEnd: str = Form(...),
    simulationStart: str = Form(...),
    simulationEnd: str = Form(...),
    file: UploadFile = File(...)
):
    global model, evals_result
    evals_result = {}
    print(f"[FastAPI] Received trainStart={trainStart}, trainEnd={trainEnd}, testStart={testStart}, testEnd={testEnd}, simulationStart={simulationStart}, simulationEnd={simulationEnd}")
    print(f"[FastAPI] Received file: {file.filename}")
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content), parse_dates=['Timestamp'])
    model, metrics = train_xgb_model(df, trainStart, trainEnd, testStart, testEnd, evals_result)

    def clean_metrics(metrics):
        def sanitize(value):
            if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                return None  # or 0.0 if you prefer
            elif isinstance(value, list):
                return [sanitize(v) for v in value]
            elif isinstance(value, dict):
                return {k: sanitize(v) for k, v in value.items()}
            return value
        return sanitize(metrics)
        print(metrics)

    return JSONResponse(clean_metrics(metrics))

@app.post("/simulate-row")
async def simulate_row(row: SimulationRow):
    global model
    if model is None:
        print("[FastAPI] Error: Model not trained yet")
        return JSONResponse({"error": "Model not trained yet"}, status_code=400)
    try:
        # Convert the row to DataFrame
        df = pd.DataFrame([row.dict()])
        row_data = df.to_dict('records')[0]
        print(f"[FastAPI] Received row data for timestamp {row_data.get('Timestamp')}: {row_data}")
        timestamp = df['Timestamp'].iloc[0]  # Save timestamp for response
        
        # Remove Timestamp column and convert to numeric
        if 'Timestamp' in df.columns:
            df = df.drop('Timestamp', axis=1)
        if 'Response' in df.columns:
            df = df.drop('Response', axis=1)    
        
        # Convert all columns to numeric, replacing errors with 0
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        if FEATURE_NAMES:
            # Add any missing columns with zeros
            for feat in FEATURE_NAMES:
                if feat not in df.columns:
                    df[feat] = 0
            # Drop unexpected columns
            df = df[[feat for feat in FEATURE_NAMES if feat in df.columns]]
        else:
            # Fallback: proceed but may mismatch
            pass
        
        print(f"[FastAPI] Processed features: {df.to_dict('records')[0]}")
        
        # Create DMatrix and predict
        dmatrix = xgb.DMatrix(df)
        prediction = float(model.predict(dmatrix)[0])
        
        print(f"[FastAPI] Made prediction for {timestamp}: {prediction}")
        response = {"timestamp": timestamp, "prediction": prediction}
        print(f"[FastAPI] Sending response: {response}")
        return response
    except Exception as e:
        print(f"[FastAPI] Error processing row: {str(e)}")
        return JSONResponse(
            {"error": f"Failed to process row: {str(e)}"}, 
            status_code=500
        )

@app.post("/simulate")
async def simulate_model(
    file: UploadFile = File(...),
    simStart: str = Form(...),
    simEnd: str = Form(...)
):
    global model
    if model is None:
        return JSONResponse({"error": "Model not trained yet"}, status_code=400)
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content), parse_dates=['Timestamp'])
    def prediction_stream():
        for result in simulate_with_model(model, df, simStart, simEnd):
            yield f"data: {json.dumps(result)}\n\n"
    return StreamingResponse(prediction_stream(), media_type="text/event-stream")