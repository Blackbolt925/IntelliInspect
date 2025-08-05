from fastapi import FastAPI, File, UploadFile, Form
from model_utils import train_and_evaluate_model
from schemas import ModelMetricsResponse

app = FastAPI()

@app.post("/train-model", response_model=ModelMetricsResponse)
async def train_model(
    trainStart: str = Form(...),
    trainEnd: str = Form(...),
    testStart: str = Form(...),
    testEnd: str = Form(...),
    simulationStart: str = Form(None),
    simulationEnd: str = Form(None),
    file: UploadFile = File(...)
):
    print(f"[FastAPI] Received trainStart={trainStart}, trainEnd={trainEnd}, testStart={testStart}, testEnd={testEnd}, simulationStart={simulationStart}, simulationEnd={simulationEnd}")
    print(f"[FastAPI] Received file: {file.filename}")
    # For now, just run the dummy model
    result = train_and_evaluate_model()
    return result
