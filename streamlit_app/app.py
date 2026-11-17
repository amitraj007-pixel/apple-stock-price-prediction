
from pathlib import Path
import joblib
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# --------------------------------------------------
# PAGE CONFIGURATION
# --------------------------------------------------

st.set_page_config(
    page_title="Apple Stock Prediction",
    page_icon="🍎",
    layout="wide"
)

# --------------------------------------------------
# PROJECT PATHS
# --------------------------------------------------

PROJECT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_DIR / "backend"

MODEL_PATH = BACKEND_DIR / "apple_stock_model.joblib"
DATASET_PATH = BACKEND_DIR / "dataset.csv"

# --------------------------------------------------
# CUSTOM CSS
# --------------------------------------------------

st.markdown("""
<style>
    :root {
        --apple-black: #080a0c;
        --apple-surface: #111619;
        --apple-surface-2: #171e21;
        --apple-border: #2a3538;
        --apple-text: #f5f7f6;
        --apple-muted: #a2ada9;
        --apple-green: #30d158;
    }

    html, body, [class*="css"] {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                     "Segoe UI", sans-serif;
    }

    .stApp {
        background:
            radial-gradient(ellipse at 82% -8%, rgba(48, 209, 88, 0.10), transparent 34%),
            linear-gradient(180deg, #0b0e10 0%, var(--apple-black) 58%);
        color: var(--apple-text);
    }

    [data-testid="stHeader"] {
        background: rgba(8, 10, 12, 0.84);
        backdrop-filter: blur(14px);
    }

    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #111619 0%, #0b0f11 100%);
        border-right: 1px solid var(--apple-border);
    }

    [data-testid="stSidebar"] > div:first-child { padding-top: 1.25rem; }

    [data-testid="stSidebar"] h1 {
        color: var(--apple-text);
        font-weight: 760;
        letter-spacing: -0.7px;
    }

    [data-testid="stSidebar"] p,
    [data-testid="stSidebar"] label,
    [data-testid="stSidebar"] [data-testid="stCaptionContainer"] {
        color: var(--apple-muted);
    }

    [data-testid="stSidebar"] [role="radiogroup"] { gap: 0.42rem; }

    [data-testid="stSidebar"] [role="radiogroup"] label {
        border-radius: 10px;
        padding: 0.38rem 0.55rem;
        transition: background 150ms ease;
    }

    [data-testid="stSidebar"] [role="radiogroup"] label:hover {
        background: rgba(48, 209, 88, 0.09);
    }

    .main-title {
        color: var(--apple-text);
        font-size: clamp(2.15rem, 3.4vw, 2.9rem);
        line-height: 1.08;
        letter-spacing: -1.5px;
        font-weight: 820;
        margin-bottom: 0.25rem;
    }

    .subtitle {
        color: var(--apple-muted);
        font-size: 1rem;
    }

    h1, h2, h3 {
        color: var(--apple-text);
        letter-spacing: -0.65px;
        font-weight: 730;
    }

    [data-testid="stMetric"] {
        background: linear-gradient(145deg, #171e21 0%, #101518 100%);
        border: 1px solid var(--apple-border);
        border-radius: 17px;
        padding: 1.12rem 1.18rem;
        min-height: 116px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
        transition: transform 160ms ease, border-color 160ms ease;
    }

    [data-testid="stMetric"]:hover {
        transform: translateY(-2px);
        border-color: rgba(48, 209, 88, 0.48);
    }

    [data-testid="stMetricLabel"] {
        color: #b3bfba;
        font-size: 0.9rem;
        font-weight: 590;
    }

    [data-testid="stMetricValue"] {
        color: var(--apple-green);
        font-size: clamp(1.4rem, 2vw, 2rem);
        font-weight: 760;
        letter-spacing: -0.7px;
    }

    div.stButton > button {
        background: var(--apple-green);
        color: #061109;
        border: 1px solid var(--apple-green);
        border-radius: 999px;
        padding: 0.62rem 1.35rem;
        font-weight: 720;
        transition: all 160ms ease;
    }

    div.stButton > button:hover {
        background: #58e477;
        border-color: #58e477;
        color: #061109;
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(48, 209, 88, 0.18);
    }

    [data-testid="stSlider"] [role="slider"] { background: var(--apple-green); }

    [data-testid="stDataFrame"],
    [data-testid="stTable"] {
        border: 1px solid var(--apple-border);
        border-radius: 13px;
        overflow: hidden;
    }

    [data-testid="stPlotlyChart"] {
        background: linear-gradient(145deg, rgba(23, 30, 33, 0.8), rgba(12, 17, 19, 0.8));
        border: 1px solid rgba(55, 70, 66, 0.7);
        border-radius: 16px;
        padding: 0.35rem;
        box-shadow: 0 9px 26px rgba(0, 0, 0, 0.16);
    }

    [data-testid="stAlert"] {
        border-radius: 13px;
        border: 1px solid var(--apple-border);
    }

    [data-testid="stCaptionContainer"] { color: var(--apple-muted); }

    hr {
        border-color: rgba(130, 153, 145, 0.2);
        margin: 1.5rem 0;
    }

    @media (max-width: 768px) {
        .main-title { font-size: 2rem; }
        [data-testid="stMetric"] { padding: 0.85rem; min-height: 100px; }
    }
</style>
""", unsafe_allow_html=True)

# --------------------------------------------------
# LOAD MODEL AND DATASET
# --------------------------------------------------

@st.cache_resource
def load_model():
    bundle = joblib.load(MODEL_PATH)
    return bundle


@st.cache_data
def load_dataset():
    df = pd.read_csv(DATASET_PATH)

    df["Date"] = pd.to_datetime(
        df["Date"], errors="coerce"
    )

    df = (
        df.dropna(subset=["Date"])
        .sort_values("Date")
        .reset_index(drop=True)
    )

    df["Daily_Return"] = (
        df["Close"].pct_change() * 100
    )

    df["Volatility_20D"] = (
        df["Daily_Return"].rolling(20).std()
    )

    return df


try:
    bundle = load_model()
    df = load_dataset()

    model = bundle["model"]
    features = bundle["features"]
    history = list(bundle["historical_closes"])
    historical_dates = bundle["historical_dates"]
    last_date = pd.to_datetime(bundle["last_date"])

except Exception as e:
    st.error(f"Unable to load project files: {e}")
    st.info(
        "Check that apple_stock_model.joblib and "
        "dataset.csv are inside the backend folder."
    )
    st.stop()


# --------------------------------------------------
# PREDICTION FUNCTION
# --------------------------------------------------

def generate_predictions(days):

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
            "Date": date,
            "Predicted Price": round(predicted_price, 2)
        })

        prices.append(predicted_price)

    return pd.DataFrame(predictions)


# --------------------------------------------------
# SIDEBAR
# --------------------------------------------------

st.sidebar.markdown("# 🍎 ApplePredict")
st.sidebar.caption("Stock Price Prediction Dashboard")

page = st.sidebar.radio(
    "NAVIGATION",
    [
        "Overview",
        "Stock Prediction",
        "EDA Dashboard",
        "Model Information"
    ]
)

st.sidebar.divider()

st.sidebar.success("Model loaded successfully")
st.sidebar.caption("Apple Inc. (AAPL)")


# --------------------------------------------------
# OVERVIEW PAGE
# --------------------------------------------------

if page == "Overview":

    st.markdown(
        '<p class="main-title">Apple Stock Analytics</p>',
        unsafe_allow_html=True
    )

    st.markdown(
        '<p class="subtitle">Machine Learning Based Stock Price Prediction</p>',
        unsafe_allow_html=True
    )

    st.divider()

    col1, col2, col3, col4 = st.columns(4)

    col1.metric(
        "Total Records",
        f"{len(df):,}"
    )

    col2.metric(
        "Latest Closing Price",
        f"${df['Close'].iloc[-1]:.2f}"
    )

    col3.metric(
        "Highest Closing Price",
        f"${df['Close'].max():.2f}"
    )

    col4.metric(
        "Average Closing Price",
        f"${df['Close'].mean():.2f}"
    )

    st.subheader("Historical Apple Stock Price")

    fig = px.area(
        df,
        x="Date",
        y="Close",
        title="Apple Closing Price History",
        color_discrete_sequence=["#32d583"]
    )

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#111619",
        plot_bgcolor="#111619",
        height=450
    )

    st.plotly_chart(fig, use_container_width=True)

    st.info(
        "Use the sidebar to explore stock predictions, "
        "exploratory data analysis and model information."
    )


# --------------------------------------------------
# STOCK PREDICTION PAGE
# --------------------------------------------------

elif page == "Stock Prediction":

    st.title("Stock Price Prediction")

    st.write(
        "Predict Apple's future stock closing prices "
        "using the trained Random Forest model."
    )

    days = st.slider(
        "Select forecast days",
        min_value=1,
        max_value=30,
        value=7
    )

    if st.button("Generate Prediction", type="primary"):

        try:
            prediction_df = generate_predictions(days)

            st.session_state["prediction_df"] = prediction_df

        except Exception as e:
            st.error(f"Prediction error: {e}")

    if "prediction_df" in st.session_state:

        prediction_df = st.session_state["prediction_df"]

        st.subheader("Prediction Results")

        col1, col2 = st.columns(2)

        col1.metric(
            "First Predicted Price",
            f"${prediction_df['Predicted Price'].iloc[0]:.2f}"
        )

        col2.metric(
            "Last Predicted Price",
            f"${prediction_df['Predicted Price'].iloc[-1]:.2f}"
        )

        historical_df = pd.DataFrame({
            "Date": pd.to_datetime(historical_dates),
            "Price": history
        })

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=historical_df["Date"],
            y=historical_df["Price"],
            name="Historical Price",
            line=dict(color="#32d583", width=2)
        ))

        fig.add_trace(go.Scatter(
            x=prediction_df["Date"],
            y=prediction_df["Predicted Price"],
            name="Predicted Price",
            line=dict(color="#ffb454", width=3, dash="dash")
        ))

        fig.update_layout(
            title="Historical vs Predicted Stock Prices",
            template="plotly_dark",
            paper_bgcolor="#111619",
            plot_bgcolor="#111619",
            height=450,
            xaxis_title="Date",
            yaxis_title="Stock Price ($)"
        )

        st.plotly_chart(fig, use_container_width=True)

        st.subheader("Prediction Table")

        display_df = prediction_df.copy()
        display_df["Date"] = display_df["Date"].dt.strftime("%Y-%m-%d")

        st.dataframe(
            display_df,
            use_container_width=True,
            hide_index=True
        )


# --------------------------------------------------
# EDA DASHBOARD
# --------------------------------------------------

elif page == "EDA Dashboard":

    st.title("Exploratory Data Analysis")

    st.write(
        "Explore Apple's historical stock market data "
        "and understand its price movements."
    )

    st.divider()

    col1, col2, col3, col4 = st.columns(4)

    col1.metric(
        "Total Records",
        f"{len(df):,}"
    )

    col2.metric(
        "Average Close",
        f"${df['Close'].mean():.2f}"
    )

    col3.metric(
        "Highest Close",
        f"${df['Close'].max():.2f}"
    )

    col4.metric(
        "Lowest Close",
        f"${df['Close'].min():.2f}"
    )

    st.caption(
        f"Dataset period: {df['Date'].min().date()} "
        f"to {df['Date'].max().date()}"
    )

    st.divider()

    st.subheader("Closing Price Trend")

    fig = px.line(
        df,
        x="Date",
        y="Close",
        title="Historical Closing Prices",
        color_discrete_sequence=["#32d583"]
    )

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#111619",
        plot_bgcolor="#111619",
        height=400
    )

    st.plotly_chart(fig, use_container_width=True)

    col1, col2 = st.columns(2)

    with col1:

        st.subheader("Trading Volume")

        fig = px.bar(
            df.iloc[::20],
            x="Date",
            y="Volume",
            color_discrete_sequence=["#42a5f5"]
        )

        fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#111619",
            plot_bgcolor="#111619",
            height=350
        )

        st.plotly_chart(fig, use_container_width=True)

    with col2:

        st.subheader("Daily Returns")

        fig = px.line(
            df,
            x="Date",
            y="Daily_Return",
            color_discrete_sequence=["#ffb454"]
        )

        fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#111619",
            plot_bgcolor="#111619",
            height=350
        )

        st.plotly_chart(fig, use_container_width=True)

    st.subheader("20-Day Rolling Volatility")

    fig = px.line(
        df,
        x="Date",
        y="Volatility_20D",
        color_discrete_sequence=["#bd93f9"]
    )

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#111619",
        plot_bgcolor="#111619",
        height=350
    )

    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Correlation Analysis")

    correlation_columns = [
        "Open", "High", "Low", "Close", "Adj Close", "Volume"
    ]

    correlation = df[correlation_columns].corr()

    fig = px.imshow(
        correlation,
        text_auto=".2f",
        color_continuous_scale="RdYlGn",
        title="Stock Feature Correlation Matrix"
    )

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#111619",
        height=500
    )

    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Monthly Average Returns")

    monthly_returns = (
        df.assign(Month=df["Date"].dt.month)
        .groupby("Month")["Daily_Return"]
        .mean()
        .reset_index()
    )

    monthly_names = {
        1: "January", 2: "February",
        3: "March", 4: "April",
        5: "May", 6: "June",
        7: "July", 8: "August",
        9: "September", 10: "October",
        11: "November", 12: "December"
    }

    monthly_returns["Month Name"] = (
        monthly_returns["Month"].map(monthly_names)
    )

    fig = px.bar(
        monthly_returns,
        x="Month Name",
        y="Daily_Return",
        color="Daily_Return",
        color_continuous_scale="RdYlGn",
        title="Average Daily Return by Calendar Month"
    )

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#111619",
        plot_bgcolor="#111619",
        height=400
    )

    st.plotly_chart(fig, use_container_width=True)


# --------------------------------------------------
# MODEL INFORMATION PAGE
# --------------------------------------------------

elif page == "Model Information":

    st.title("Model Information")

    st.write(
        "Compare the four forecasting models evaluated in the combined "
        "notebook and review the Random Forest model deployed in this dashboard."
    )

    st.divider()

    # --------------------------------------------------
    # MODEL COMPARISON
    # Values are taken from the notebook's final_results output.
    # --------------------------------------------------

    st.subheader("Model Performance Comparison")

    st.caption(
        "Evaluation results from the combined notebook's test-set comparison. "
        "Lower values indicate better performance for all four metrics."
    )

    comparison_df = pd.DataFrame({
        "Model": ["ARIMA", "SARIMA", "XGBoost", "Random Forest"],
        "MAE": [108.7125, 108.6734, 110.3187, 109.8434],
        "MSE": [18336.3582, 18327.3159, 18686.9180, 18580.3239],
        "RMSE": [135.4118, 135.3784, 136.7001, 136.3097],
        "MAPE (%)": [59.5527, 59.5175, 60.9729, 60.5186]
    })

    st.dataframe(
        comparison_df.style.format({
            "MAE": "{:.4f}",
            "MSE": "{:.4f}",
            "RMSE": "{:.4f}",
            "MAPE (%)": "{:.4f}"
        }),
        use_container_width=True,
        hide_index=True
    )

    st.subheader("Overall Model Ranking")

    ranking_df = pd.DataFrame({
        "Model": ["SARIMA", "ARIMA", "Random Forest", "XGBoost"],
        "Average Rank": [1.0, 2.0, 3.0, 4.0],
        "Result": [
            "Best overall in notebook evaluation",
            "Second",
            "Third",
            "Fourth"
        ]
    })

    st.dataframe(
        ranking_df,
        use_container_width=True,
        hide_index=True
    )

    st.success(
        "SARIMA achieved the best overall test-set ranking in the notebook "
        "across MAE, MSE, RMSE and MAPE."
    )

    st.info(
        "The live dashboard prediction page still uses the saved Random Forest "
        "model from apple_stock_model.joblib. The notebook's best-ranked model "
        "and the model currently deployed in this dashboard are therefore "
        "not the same."
    )

    st.divider()

    # --------------------------------------------------
    # DEPLOYED MODEL DETAILS
    # --------------------------------------------------

    st.subheader("Model Currently Used for Predictions")

    st.success("Random Forest model loaded from the saved model bundle.")

    col1, col2, col3 = st.columns(3)

    col1.metric(
        "Deployed Algorithm",
        "Random Forest"
    )

    col2.metric(
        "Input Features",
        len(features)
    )

    col3.metric(
        "Historical Observations",
        f"{len(history):,}"
    )

    st.subheader("Model Input Features")

    feature_cols = st.columns(3)
    for index, feature in enumerate(features):
        with feature_cols[index % 3]:
            st.write(f"• {feature}")

    st.subheader("Prediction Methodology")

    st.write("""
    1. Load historical closing prices from the saved model bundle.
    2. Calculate lag features and moving averages.
    3. Calculate daily returns and short-term volatility.
    4. Prepare the input using the feature columns expected by the saved model.
    5. Predict the next business day's closing price using Random Forest.
    6. Append the predicted price to the price history and repeat for the
       selected forecast period.
    """)

    st.subheader("Saved Model Information")

    st.write(
        "The dashboard reuses the existing trained Random Forest model bundle. "
        "The comparison table above reports the notebook's evaluation results; "
        "it does not change or retrain the model used by the prediction page."
    )

    st.write(f"Last historical date: {last_date.date()}")

    st.caption(
        "Note: Notebook metrics are reproduced from the saved notebook outputs. "
        "They will change if the models are retrained or the test data changes."
    )


# --------------------------------------------------
# FOOTER
# --------------------------------------------------

st.divider()

st.caption(
    "ApplePredict  |  Apple Stock Analytics  |  Machine Learning Dashboard"
)
