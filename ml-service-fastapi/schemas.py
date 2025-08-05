
from pydantic import BaseModel
from typing import List, Dict

class TrainModelRequest(BaseModel):
    trainStart: str
    trainEnd: str
    testStart: str
    testEnd: str

class ModelMetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_accuracy: List[float]
    training_loss: List[float]
    confusion_matrix: Dict[str, int]
