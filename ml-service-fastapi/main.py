from fastapi import FastAPI, Request, File, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import pandas as pd
import xgboost as xgb
import io, json, math
from model_utils import train_xgb_model, simulate_with_model, FEATURE_NAMES

app = FastAPI()
model = None

class SimulationRow(BaseModel):
    Timestamp: str
    class Config:
        extra = "allow"

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
    global model
    print(f"[FastAPI] Received file: {file.filename}")
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content), parse_dates=['Timestamp'])
    model, metrics = train_xgb_model(df, trainStart, trainEnd, testStart, testEnd)

    def clean_metrics(metrics):
        def sanitize(value):
            if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                return None
            elif isinstance(value, list):
                return [sanitize(v) for v in value]
            elif isinstance(value, dict):
                return {k: sanitize(v) for k, v in value.items()}
            return value
        return sanitize(metrics)

    return JSONResponse(clean_metrics(metrics))

@app.post("/simulate-row")
async def simulate_row(row: SimulationRow):
    global model, FEATURE_NAMES
    if model is None:
        return JSONResponse({"error": "Model not trained yet"}, status_code=400)

    try:
        # Load FEATURE_NAMES if not already
        if not FEATURE_NAMES:
            with open("trained_features.json", "r") as f:
                FEATURE_NAMES = json.load(f)

        df = pd.DataFrame([row.dict()])
        timestamp = df['Timestamp'].iloc[0]
        df = df.drop(columns=[col for col in ['Timestamp', 'Response'] if col in df.columns])
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        for feat in FEATURE_NAMES:
            if feat not in df.columns:
                df[feat] = 0
        df = df[FEATURE_NAMES]

        dmatrix = xgb.DMatrix(df)
        prediction = float(model.predict(dmatrix)[0])
        return {"timestamp": timestamp, "prediction": prediction}
    except Exception as e:
        return JSONResponse({"error": f"Failed to process row: {str(e)}"}, status_code=500)

@app.post("/simulate")
async def simulate_model(file: UploadFile = File(...), simStart: str = Form(...), simEnd: str = Form(...)):
    global model
    if model is None:
        return JSONResponse({"error": "Model not trained yet"}, status_code=400)
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content), parse_dates=['Timestamp'])

    def prediction_stream():
        for result in simulate_with_model(model, df, simStart, simEnd):
            yield f"data: {json.dumps(result)}\n\n"
    return StreamingResponse(prediction_stream(), media_type="text/event-stream")
