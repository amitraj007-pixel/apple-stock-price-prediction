
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

# Load complete dataset for EDA
eda_df = pd.read_csv("dataset.csv")

eda_df["Date"] = pd.to_datetime(
    eda_df["Date"], errors="coerce"
)

eda_df = (
    eda_df.dropna(subset=["Date"])
    .sort_values("Date")
    .reset_index(drop=True)
)

# Calculate EDA features
eda_df["Daily_Return"] = (
    eda_df["Close"].pct_change() * 100
)

eda_df["Volatility_20D"] = (
    eda_df["Daily_Return"].rolling(20).std()
)

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


# Existing stock prediction endpoint
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


# New EDA endpoint
@app.get("/eda-data")
def get_eda_data():

    # Prepare chart data
    chart_df = eda_df.iloc[::20].copy()

    chart_data = []

    for _, row in chart_df.iterrows():
        chart_data.append({
            "date": row["Date"].strftime("%Y-%m-%d"),
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
            "daily_return": (
                round(float(row["Daily_Return"]), 4)
                if pd.notna(row["Daily_Return"]) else None
            ),
            "volatility": (
                round(float(row["Volatility_20D"]), 4)
                if pd.notna(row["Volatility_20D"]) else None
            )
        })

    # Calculate summary statistics
    summary = {
        "total_records": int(len(eda_df)),
        "start_date": eda_df["Date"].min().strftime("%Y-%m-%d"),
        "end_date": eda_df["Date"].max().strftime("%Y-%m-%d"),
        "average_close": round(float(eda_df["Close"].mean()), 4),
        "highest_close": round(float(eda_df["Close"].max()), 4),
        "lowest_close": round(float(eda_df["Close"].min()), 4),
        "average_volume": int(eda_df["Volume"].mean()),
        "average_daily_return": round(
            float(eda_df["Daily_Return"].mean()), 4
        )
    }

    # Correlation analysis
    correlation_columns = [
        "Open", "High", "Low", "Close", "Adj Close", "Volume"
    ]

    correlation_df = eda_df[
        correlation_columns
    ].corr().round(4)

    correlation = {
        column: {
            row: (
                float(correlation_df.loc[row, column])
                if pd.notna(correlation_df.loc[row, column])
                else None
            )
            for row in correlation_columns
        }
        for column in correlation_columns
    }

    # Monthly average returns
    monthly = (
        eda_df.assign(
            Month=eda_df["Date"].dt.month
        )
        .groupby("Month")["Daily_Return"]
        .mean()
        .round(4)
    )

    monthly_returns = [
        {
            "month": int(month),
            "average_return": float(value)
        }
        for month, value in monthly.items()
        if pd.notna(value)
    ]

    return {
        "summary": summary,
        "chart_data": chart_data,
        "correlation": correlation,
        "monthly_returns": monthly_returns
    }
