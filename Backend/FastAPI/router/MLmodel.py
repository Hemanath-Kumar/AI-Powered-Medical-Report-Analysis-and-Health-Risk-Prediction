from fastapi import APIRouter, Body, HTTPException
from schemas.MlmodelSchemas import MLmodelRequest, MLmodelResponse
import pickle
import pandas as pd

router = APIRouter(prefix="/MLmodel")

# Exact feature order the scaler was trained on
FEATURE_COLUMNS = ['gender', 'age', 'cigsPerDay', 'BPMeds', 'prevalentHyp', 'diabetes', 'totChol', 'sysBP', 'BMI', 'glucose']

@router.post("/predict")
def predict_MLmodel(request: MLmodelRequest = Body(...)):
    try:
        raw = request.data

        # Wrap scalars in lists so pd.DataFrame builds a single-row frame
        data = {k: ([v] if not isinstance(v, list) else v) for k, v in raw.items()}
        df = pd.DataFrame(data)

        # Enforce the exact column order the scaler expects
        df = df[FEATURE_COLUMNS]

        with open("ML/model_bundle.pkl", "rb") as f:
            model = pickle.load(f)

        lr        = model['model']
        scaler    = model['scaler']
        THRESHOLD = model['threshold']

        X_scaled = scaler.transform(df)
        proba    = lr.predict_proba(X_scaled)[:, 1]

        # Convert numpy types → plain Python so Pydantic can serialize them
        result      = int((proba[0] >= THRESHOLD))
        probability = float(proba[0])

        response = MLmodelResponse(
            message="MLmodel prediction",
            data={"result": result, "probability": probability}
        )
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MLmodel failed: {str(e)}")