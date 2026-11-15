
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd

app = FastAPI(title="Apple Stock Prediction API")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load saved model bundle
bundle = joblib.load("apple_stock_model.joblib")

model = bundle["model"]
features = bundle["features"]
history = bundle["historical_closes"]
historical_dates = bundle["historical_dates"]
last_date = pd.to_datetime(bundle["last_date"])

# Verify historical data
if len(historical_dates) != len(history):
    raise ValueError(
        "Historical dates and closing prices do not match."
    )


@app.get("/")
def home():
    return {
        "message": "Apple Stock Prediction API is running!"
    }


@app.get("/predict")
def predict(days: int = 30):

    if days < 1 or days > 30:
        return {
            "error": "Please select between 1 and 30 days."
        }

    prices = list(history)

    future_dates = pd.bdate_range(
        start=last_date + pd.offsets.BDay(1),
        periods=days
    )

    predictions = []

    for date in future_dates:

        hist = pd.Series(prices)
        daily_returns = hist.pct_change() * 100

        input_data = pd.DataFrame([{
            "Close_Lag_1": hist.iloc[-1],
            "Close_Lag_5": hist.iloc[-5],
            "Close_Lag_10": hist.iloc[-10],
            "Close_Lag_20": hist.iloc[-20],
            "MA_5": hist.iloc[-5:].mean(),
            "MA_20": hist.iloc[-20:].mean(),
            "Daily_Return": daily_returns.iloc[-1],
            "Volatility_5": daily_returns.iloc[-5:].std(),
            "Month": date.month
        }])

        predicted_price = float(
            model.predict(input_data[features])[0]
        )

        predictions.append({
            "date": date.strftime("%Y-%m-%d"),
            "predicted_price": round(predicted_price, 2)
        })

        prices.append(predicted_price)

    return {
        "company": "Apple",
        "forecast_days": days,
        "historical_dates": historical_dates,
        "historical_prices": history,
        "predictions": predictions
    }
