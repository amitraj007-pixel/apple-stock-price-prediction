
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [days, setDays] = useState(30);
  const [predictions, setPredictions] = useState([]);
  const [historicalPrices, setHistoricalPrices] = useState([]);
  const [historicalDates, setHistoricalDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [edaData, setEdaData] = useState(null);
  const [edaLoading, setEdaLoading] = useState(true);
  const [edaError, setEdaError] = useState("");

  // Fetch EDA data when dashboard loads
  useEffect(() => {
    const getEdaData = async () => {
      try {
        const response = await fetch(`${API_URL}/eda-data`);

        if (!response.ok) {
          throw new Error("Unable to load EDA data.");
        }

        const data = await response.json();
        setEdaData(data);
      } catch (err) {
        setEdaError(err.message);
      } finally {
        setEdaLoading(false);
      }
    };

    getEdaData();
  }, []);

  // Generate stock prediction
  const getPrediction = async () => {
    setLoading(true);
    setError("");
    setPredictions([]);

    try {
      const response = await fetch(
        `${API_URL}/predict?days=${days}`
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to get predictions");
      }

      if (!Array.isArray(data.predictions)) {
        throw new Error("Invalid prediction data received.");
      }

      setPredictions(data.predictions);
      setHistoricalPrices(data.historical_prices || []);
      setHistoricalDates(data.historical_dates || []);
    } catch (err) {
      setError(err.message || "Could not connect to the prediction server.");
    } finally {
      setLoading(false);
    }
  };

  const prices = predictions.map((item) =>
    Number(item.predicted_price)
  );

  const average = prices.length
    ? prices.reduce((sum, price) => sum + price, 0) / prices.length
    : 0;

  const highest = prices.length ? Math.max(...prices) : 0;
  const lowest = prices.length ? Math.min(...prices) : 0;

  const chartData = [
    ...historicalPrices.slice(-30).map((price, index) => ({
      date:
        historicalDates[
          historicalDates.length -
          Math.min(30, historicalPrices.length) +
          index
        ] || `History ${index + 1}`,
      historical: Number(price),
    })),
    ...predictions.map((item) => ({
      date: item.date,
      predicted: Number(item.predicted_price),
    })),
  ];

  const formatPrice = (value) =>
    `$${Number(value).toFixed(2)}`;

  const formatVolume = (value) =>
    `${(Number(value) / 1000000).toFixed(0)}M`;

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const monthlyChartData = edaData?.monthly_returns.map((item) => ({
    month: monthNames[item.month - 1],
    average_return: item.average_return,
  })) || [];

  const correlationColumns = [
    "Open", "High", "Low", "Close", "Adj Close", "Volume",
  ];

  const modelComparison = [
    { model: "ARIMA", mae: 25.41, mse: 1159.85, rmse: 34.06, mape: 11.68 },
    { model: "SARIMA", mae: 25.39, mse: 1158.38, rmse: 34.03, mape: 11.67 },
    { model: "XGBoost", mae: 22.41, mse: 1060.43, rmse: 32.56, mape: 9.65 },
    { model: "Random Forest", mae: 22.70, mse: 1056.37, rmse: 32.50, mape: 9.84 },
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon"></span>
          <span>ApplePredict</span>
        </div>

        <p className="menu-label">MENU</p>
        <a className="nav-link active" href="#overview">◈ Overview</a>
        <a className="nav-link" href="#prediction">↗ Predictions</a>
        <a className="nav-link" href="#analytics">▥ Analytics</a>
        <a className="nav-link" href="#eda">▤ EDA Dashboard</a>
        <a className="nav-link" href="#models">◉ Model Information</a>
        <a className="nav-link" href="#about">ⓘ About Project</a>

        <div className="sidebar-bottom">
          <span className="live-dot"></span>
          Machine Learning Powered
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCIAL INTELLIGENCE</p>
            <h2>Stock Analytics Dashboard</h2>
          </div>
          <div className="market-status">
            <span className="live-dot"></span>
            Prediction System Online
          </div>
        </header>

        <section className="welcome" id="overview">
          <div>
            <p className="eyebrow">WELCOME TO APPLEPREDICT</p>
            <h1>Apple Stock <span>Insights.</span></h1>
            <p>
              Explore machine learning based stock price forecasts
              and market analytics.
            </p>
          </div>
          <div className="apple-symbol">AAPL</div>
        </section>

        <section className="stock-overview">
          <div className="stock-title">
            <div className="apple-logo">A</div>
            <div>
              <h2>Apple Inc.</h2>
              <p>NASDAQ · AAPL · USD</p>
            </div>
          </div>
          <span className="stock-tag">STOCK FORECAST</span>
        </section>

        {/* Stock Prediction */}
        <section className="prediction-card" id="prediction">
          <div>
            <p className="eyebrow">AI FORECAST ENGINE</p>
            <h2>Generate Stock Prediction</h2>
            <p>Choose the number of future trading days.</p>
          </div>

          <div className="prediction-controls">
            <div>
              <label htmlFor="days">Forecast days</label>
              <input
                id="days"
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>

            <button
              onClick={getPrediction}
              disabled={loading || days < 1 || days > 30}
            >
              {loading ? "Generating..." : "Generate Forecast →"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}
        </section>

        {predictions.length > 0 && (
          <>
            <section className="stats-grid" id="analytics">
              <div className="stat-card">
                <p>AVERAGE FORECAST</p>
                <h2>{formatPrice(average)}</h2>
                <span>Across {predictions.length} trading days</span>
              </div>

              <div className="stat-card">
                <p>HIGHEST PREDICTION</p>
                <h2 className="green">{formatPrice(highest)}</h2>
                <span>Maximum forecast value</span>
              </div>

              <div className="stat-card">
                <p>LOWEST PREDICTION</p>
                <h2 className="red">{formatPrice(lowest)}</h2>
                <span>Minimum forecast value</span>
              </div>

              <div className="stat-card">
                <p>FORECAST DAYS</p>
                <h2>{predictions.length}</h2>
                <span>Trading day predictions</span>
              </div>
            </section>

            <section className="chart-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PRICE MOVEMENT</p>
                  <h2>Historical vs Predicted Price</h2>
                </div>
                <span className="chart-badge">AAPL · USD</span>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="priceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#32d583" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#32d583" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#263344" />
                    <XAxis dataKey="date" stroke="#8492a6" tick={{ fontSize: 11 }} />
                    <YAxis
                      stroke="#8492a6"
                      domain={["auto", "auto"]}
                      tickFormatter={formatPrice}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#172334",
                        border: "1px solid #34445a",
                        borderRadius: "10px",
                        color: "#ffffff",
                      }}
                      formatter={(value) => formatPrice(value)}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />

                    <Area
                      type="monotone"
                      dataKey="historical"
                      name="Historical Price"
                      stroke="#60a5fa"
                      fill="#60a5fa"
                      fillOpacity={0.12}
                      connectNulls
                    />

                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Predicted Price"
                      stroke="#32d583"
                      strokeWidth={3}
                      dot={false}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="chart-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">DETAILED FORECAST</p>
                  <h2>Prediction Results</h2>
                </div>
                <span className="chart-badge">
                  {predictions.length} Records
                </span>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Trading Date</th>
                      <th>Predicted Price (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((item, index) => (
                      <tr key={index}>
                        <td>{item.date}</td>
                        <td className="table-price">
                          {formatPrice(item.predicted_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* EDA Dashboard */}
        <section id="eda" className="eda-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORATORY DATA ANALYSIS</p>
              <h2>Apple Stock Data Insights</h2>
              <p className="section-description">
                Explore historical stock prices, trading activity,
                returns and correlations.
              </p>
            </div>
            <span className="chart-badge">HISTORICAL DATA</span>
          </div>

          {edaLoading && <p className="loading-message">Loading EDA data...</p>}
          {edaError && <p className="error">{edaError}</p>}

          {edaData && (
            <>
              <div className="stats-grid eda-stats">
                <div className="stat-card">
                  <p>TOTAL RECORDS</p>
                  <h2>{edaData.summary.total_records.toLocaleString("en-US")}</h2>
                  <span>Historical trading records</span>
                </div>

                <div className="stat-card">
                  <p>AVERAGE CLOSING PRICE</p>
                  <h2>{formatPrice(edaData.summary.average_close)}</h2>
                  <span>Across the dataset</span>
                </div>

                <div className="stat-card">
                  <p>HIGHEST CLOSING PRICE</p>
                  <h2 className="green">{formatPrice(edaData.summary.highest_close)}</h2>
                  <span>Maximum recorded close</span>
                </div>

                <div className="stat-card">
                  <p>AVERAGE TRADING VOLUME</p>
                  <h2>{formatVolume(edaData.summary.average_volume)}</h2>
                  <span>Shares traded per session</span>
                </div>
              </div>

              <div className="eda-date-range">
                Data period: <strong>{edaData.summary.start_date}</strong>
                {" "}to{" "}
                <strong>{edaData.summary.end_date}</strong>
              </div>

              <section className="chart-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">HISTORICAL PERFORMANCE</p>
                    <h2>Apple Closing Price Trend</h2>
                  </div>
                  <span className="chart-badge">CLOSING PRICE · USD</span>
                </div>

                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={edaData.chart_data}>
                      <defs>
                        <linearGradient id="edaPriceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#32d583" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#32d583" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263344" />
                      <XAxis dataKey="date" stroke="#8492a6" tick={{ fontSize: 10 }} minTickGap={35} />
                      <YAxis stroke="#8492a6" tickFormatter={formatPrice} />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Area
                        type="monotone"
                        dataKey="close"
                        name="Closing Price"
                        stroke="#32d583"
                        fill="url(#edaPriceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <div className="eda-chart-grid">
                <section className="chart-card">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">MARKET ACTIVITY</p>
                      <h2>Trading Volume</h2>
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={edaData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#263344" />
                        <XAxis dataKey="date" stroke="#8492a6" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#8492a6" tickFormatter={formatVolume} />
                        <Tooltip formatter={(value) => Number(value).toLocaleString("en-US")} />
                        <Bar dataKey="volume" name="Volume" fill="#60a5fa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="chart-card">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">RETURN ANALYSIS</p>
                      <h2>Daily Returns (%)</h2>
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={edaData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#263344" />
                        <XAxis dataKey="date" stroke="#8492a6" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#8492a6" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="daily_return"
                          name="Daily Return"
                          stroke="#f6ad55"
                          dot={false}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="chart-card">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">RISK ANALYSIS</p>
                      <h2>20-Day Volatility</h2>
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={edaData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#263344" />
                        <XAxis dataKey="date" stroke="#8492a6" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#8492a6" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="volatility"
                          name="20-Day Volatility"
                          stroke="#c084fc"
                          dot={false}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="chart-card">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">SEASONAL ANALYSIS</p>
                      <h2>Average Monthly Returns</h2>
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#263344" />
                        <XAxis dataKey="month" stroke="#8492a6" />
                        <YAxis stroke="#8492a6" />
                        <Tooltip />
                        <Bar dataKey="average_return" name="Average Return (%)" fill="#32d583" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <section className="chart-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">RELATIONSHIP ANALYSIS</p>
                    <h2>Stock Feature Correlation</h2>
                  </div>
                </div>

                <div className="table-container">
                  <table className="correlation-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        {correlationColumns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationColumns.map((row) => (
                        <tr key={row}>
                          <td><strong>{row}</strong></td>
                          {correlationColumns.map((column) => {
                            const value = edaData.correlation[column][row];
                            return (
                              <td key={column}>
                                {value === null ? "—" : Number(value).toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </section>

        {/* Model Information */}
        <section id="models" className="model-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MACHINE LEARNING</p>
              <h2>Model Information & Evaluation</h2>
              <p className="section-description">
                Comparison of forecasting algorithms evaluated in the notebook.
              </p>
            </div>
            <span className="chart-badge">MODEL ANALYSIS</span>
          </div>

          <div className="model-cards">
            <div className="model-info-card">
              <h3>ARIMA</h3>
              <p>AutoRegressive Integrated Moving Average. A time-series forecasting method.</p>
            </div>
            <div className="model-info-card">
              <h3>SARIMA</h3>
              <p>Seasonal ARIMA. Extends ARIMA to represent seasonal patterns.</p>
            </div>
            <div className="model-info-card">
              <h3>XGBoost</h3>
              <p>Gradient-boosted decision trees used for regression prediction.</p>
            </div>
            <div className="model-info-card featured-model">
              <h3>Random Forest</h3>
              <p>Ensemble of decision trees. Used by the current website prediction API.</p>
            </div>
          </div>

          <section className="chart-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">NOTEBOOK COMPARISON CHART</p>
                <h2>Model Performance Comparison</h2>
              </div>
            </div>

            <p className="section-description">
              Values below are transcribed from the notebook's four-model
              comparison graph.
            </p>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>MAE</th>
                    <th>MSE</th>
                    <th>RMSE</th>
                    <th>MAPE (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {modelComparison.map((item) => (
                    <tr key={item.model}>
                      <td><strong>{item.model}</strong></td>
                      <td>{item.mae.toFixed(2)}</td>
                      <td>{item.mse.toFixed(2)}</td>
                      <td>{item.rmse.toFixed(2)}</td>
                      <td>{item.mape.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="chart-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">FINAL TUNED MODEL</p>
                <h2>Random Forest Evaluation</h2>
              </div>
              <span className="chart-badge">CURRENT API MODEL</span>
            </div>

            <div className="stats-grid model-metrics">
              <div className="stat-card">
                <p>MAE</p>
                <h2>109.8434</h2>
              </div>
              <div className="stat-card">
                <p>MSE</p>
                <h2>18,580.3239</h2>
              </div>
              <div className="stat-card">
                <p>RMSE</p>
                <h2>136.3097</h2>
              </div>
              <div className="stat-card">
                <p>MAPE</p>
                <h2>60.5186%</h2>
              </div>
            </div>

            <div className="model-details">
              <h3>Best hyperparameters shown in notebook</h3>
              <p><strong>max_depth:</strong> 10</p>
              <p><strong>min_samples_leaf:</strong> 2</p>
            </div>

            <p className="model-note">
              Note: The final tuned Random Forest evaluation above differs
              from the Random Forest values in the earlier comparison graph.
              These are shown separately and should not be treated as the
              same evaluation run.
            </p>
          </section>
        </section>

        <section className="about-card" id="about">
          <p className="eyebrow">ABOUT THE PROJECT</p>
          <h2>Machine Learning Meets Finance.</h2>
          <p>
            ApplePredict is an academic stock forecasting project
            using historical Apple stock data and a Random Forest
            machine learning model. It uses Python, FastAPI,
            React and Recharts to generate and visualize forecasts.
          </p>
        </section>

        <footer>
          ApplePredict · MCA Final Year Project · Built with Machine Learning
        </footer>
      </main>
    </div>
  );
}

export default App;
