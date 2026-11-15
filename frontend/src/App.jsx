
import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./App.css";

function App() {
  const [days, setDays] = useState(30);
  const [predictions, setPredictions] = useState([]);
  const [historicalPrices, setHistoricalPrices] = useState([]);
  const [historicalDates, setHistoricalDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPrediction = async () => {
    setLoading(true);
    setError("");
    setPredictions([]);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/predict?days=${days}`
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
        historicalDates[historicalDates.length -
          Math.min(30, historicalPrices.length) + index] ||
        `History ${index + 1}`,
      historical: Number(price),
    })),
    ...predictions.map((item) => ({
      date: item.date,
      predicted: Number(item.predicted_price),
    })),
  ];

  const formatPrice = (value) =>
    `$${Number(value).toFixed(2)}`;

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
                    <Tooltip formatter={(value) => formatPrice(value)} />
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
