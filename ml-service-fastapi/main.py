from fastapi import FastAPI
from model_utils import train_and_evaluate_model
from schemas import ModelMetricsResponse

app = FastAPI()

@app.post("/train-model", response_model=ModelMetricsResponse)
def train_model():
    result = train_and_evaluate_model()
    return result
