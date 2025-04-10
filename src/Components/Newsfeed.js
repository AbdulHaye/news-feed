import React, { useState, useEffect, useRef } from "react";

const NewsFeed = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const heartbeatInterval = useRef(null);

  const connectWebSocket = () => {
    wsRef.current = new WebSocket(
      "wss://stream.binance.com:9443/ws/bnbusdt@trade"
    );

    wsRef.current.onopen = () => {
      setConnectionStatus("Connected");
      reconnectAttempts.current = 0;
      // Start heartbeat
      heartbeatInterval.current = setInterval(() => {
        wsRef.current.send(JSON.stringify({ ping: Date.now() }));
      }, 30000);
    };

    wsRef.current.onmessage = (event) => {
      const tradeData = JSON.parse(event.data);
      // Filter out ping/pong messages
      if (tradeData.p) {
        const newMessage = {
          text: `Price: $${Number(tradeData.p).toFixed(2)}, Quantity: ${Number(
            tradeData.q
          ).toFixed(4)}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [newMessage, ...prev.slice(0, 49)]);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Connection error");
    };

    wsRef.current.onclose = (e) => {
      clearInterval(heartbeatInterval.current);
      if (e.code !== 1000) {
        const timeout = Math.min(5000 * (reconnectAttempts.current + 1), 30000);
        setTimeout(connectWebSocket, timeout);
        reconnectAttempts.current += 1;
      }
      setConnectionStatus(
        `Disconnected - Reconnecting in ${
          (5000 * (reconnectAttempts.current + 1)) / 1000
        }s...`
      );
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
      clearInterval(heartbeatInterval.current);
    };
  }, []);

  const handleClearMessages = () => setMessages([]);

  return (
<div className="container py-4">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-white border-bottom px-4 py-3 d-flex flex-column flex-md-row align-items-center justify-content-between">
          <div className="d-flex align-items-center mb-2 mb-md-0">
            <h3 className="fw-semibold mb-0 me-3">BNB/USDT Live Trades</h3>
            <div className="d-flex align-items-center">
              <span
                className={`rounded-circle ${
                  connectionStatus === "Connected" ? "bg-success" : "bg-danger"
                }`}
                style={{ width: '10px', height: '10px' }}
              ></span>
              <span className="text-muted small ms-2">{connectionStatus}</span>
            </div>
          </div>
          <button
            onClick={handleClearMessages}
            className="btn btn-outline-danger btn-sm d-flex align-items-center"
            disabled={messages.length === 0}
          >
            <i className="bi bi-trash3 me-2"></i>
            Clear History
          </button>
        </div>

        <div className="card-body p-0">
          <div className="position-relative">
            <div className="border-bottom bg-light px-4 py-2 d-flex justify-content-between">
              <span className="text-muted small">
                Live Stream - BNB/USDT Trades
              </span>
              <span className="text-muted small">
                {messages.length > 0
                  ? `Receiving updates every ${Math.floor(
                      (new Date() - new Date(messages[0]?.timestamp)) / 1000
                    )}s`
                  : "Waiting for messages..."}
              </span>
            </div>

            <div
              className="list-group overflow-auto"
              style={{ maxHeight: "500px" }}
            >
              {messages.length === 0 ? (
                <div className="text-center p-5 bg-light">
                  <div className="mb-4 text-muted opacity-50">
                    <i className="bi bi-activity fs-1"></i>
                  </div>
                  <h5 className="text-muted mb-2">
                    Establishing Real-Time Connection
                  </h5>
                  <p className="text-muted small">
                    {connectionStatus.includes("Connecting")
                      ? "Initializing market data feed..."
                      : "Streaming live trade updates..."}
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center px-4 py-3 border-bottom"
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-lightning-charge text-warning me-3"></i>
                      <div>
                        <span className="text-dark fw-medium">
                          {message.text.split(",")[0]}
                        </span>
                        <span className="text-muted ms-2">
                          {message.text.split(",")[1]}
                        </span>
                      </div>
                    </div>
                    <span className="text-muted small text-nowrap">
                      {new Date(message.timestamp).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card-footer bg-white border-top px-4 py-2">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              Connected to:{" "}
              <span className="font-monospace text-truncate">
                wss://stream.binance.com:9443/ws/bnbusdt@trade
              </span>
            </span>
            <span className="badge bg-light text-dark border">
              {messages.length} trades
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NewsFeed;