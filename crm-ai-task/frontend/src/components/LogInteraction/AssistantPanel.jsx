import React, { useState, useEffect } from 'react';

export default function AssistantPanel() {
  const [insights, setInsights] = useState(null);
  const [recentInteractions, setRecentInteractions] = useState([]);

  // Listen for extracted data from conversational panel
  useEffect(() => {
    const handleExtractedData = (event) => {
      if (event.detail && event.detail.extractedData) {
        setInsights(event.detail.extractedData);
      }
    };

    window.addEventListener('extractedData', handleExtractedData);
    return () => window.removeEventListener('extractedData', handleExtractedData);
  }, []);

  return (
    <div style={{
      border: "2px solid #ffc107",
      borderRadius: "8px",
      padding: "24px",
      width: "100%",
      maxWidth: "400px",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Inter', sans-serif",
      height: "80vh",
      maxHeight: "800px",
      overflowY: "auto"
    }}>
      <h2 style={{ marginTop: 0, color: "#2c3e50" }}>🤖 AI Assistant</h2>
      
      {!insights && (
        <div style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px dashed #ddd",
          textAlign: "center",
          color: "#6c757d"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>💡</div>
          <p>AI insights will appear here when you use the Conversational AI panel.</p>
          <p style={{ fontSize: "12px", marginTop: "8px" }}>
            The AI will extract entities, analyze sentiment, and suggest follow-ups.
          </p>
        </div>
      )}

      {insights && (
        <div>
          {/* Extracted Entities */}
          <div style={{
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e0e0e0"
          }}>
            <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4a90e2" }}>
              📋 Extracted Information
            </h3>
            
            {insights.hcp_name && (
              <div style={{ marginBottom: "8px" }}>
                <strong>👤 HCP:</strong> {insights.hcp_name}
              </div>
            )}
            
            {insights.datetime && (
              <div style={{ marginBottom: "8px" }}>
                <strong>📅 Date/Time:</strong> {new Date(insights.datetime).toLocaleString()}
              </div>
            )}
            
            {insights.summary && (
              <div style={{ marginBottom: "8px" }}>
                <strong>📝 Summary:</strong>
                <div style={{ 
                  marginTop: "4px", 
                  padding: "8px", 
                  backgroundColor: "#f8f9fa", 
                  borderRadius: "4px",
                  fontSize: "13px"
                }}>
                  {insights.summary}
                </div>
              </div>
            )}
            
            {insights.topics && insights.topics.length > 0 && (
              <div style={{ marginBottom: "8px" }}>
                <strong>🏷️ Topics:</strong>
                <div style={{ marginTop: "4px" }}>
                  {insights.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        margin: "2px",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sentiment Analysis */}
          {insights.sentiment && (
            <div style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4a90e2" }}>
                😊 Sentiment Analysis
              </h3>
              <div style={{
                marginTop: "8px",
                padding: "12px",
                backgroundColor: 
                  insights.sentiment === 'positive' ? "#d4edda" :
                  insights.sentiment === 'negative' ? "#f8d7da" : "#fff3cd",
                borderRadius: "6px",
                textAlign: "center",
                fontSize: "18px",
                fontWeight: 600,
                color: 
                  insights.sentiment === 'positive' ? "#155724" :
                  insights.sentiment === 'negative' ? "#721c24" : "#856404"
              }}>
                {insights.sentiment === 'positive' && '😊 Positive'}
                {insights.sentiment === 'neutral' && '😐 Neutral'}
                {insights.sentiment === 'negative' && '😞 Negative'}
              </div>
            </div>
          )}

          {/* Materials & Samples */}
          {(insights.materials?.length > 0 || insights.samples?.length > 0) && (
            <div style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4a90e2" }}>
                📦 Shared Items
              </h3>
              
              {insights.materials?.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <strong>📄 Materials ({insights.materials.length}):</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "20px", fontSize: "13px" }}>
                    {insights.materials.map((mat, idx) => (
                      <li key={idx}>
                        {mat.material_type} {mat.quantity > 0 && `(x${mat.quantity})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {insights.samples?.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <strong>💊 Samples ({insights.samples.length}):</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "20px", fontSize: "13px" }}>
                    {insights.samples.map((samp, idx) => (
                      <li key={idx}>
                        {samp.product_code} {samp.quantity > 0 && `(x${samp.quantity})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Suggested Follow-ups */}
          {insights.suggested_follow_ups && insights.suggested_follow_ups.length > 0 && (
            <div style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4a90e2" }}>
                ✅ Suggested Follow-ups
              </h3>
              <div style={{ marginTop: "8px" }}>
                {insights.suggested_follow_ups.map((fu, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "8px",
                      padding: "10px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "6px",
                      borderLeft: "4px solid #28a745"
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                      {fu.action_item}
                    </div>
                    {fu.priority && (
                      <div style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        color: 
                          fu.priority === 'high' ? "#dc3545" :
                          fu.priority === 'medium' ? "#ffc107" : "#6c757d"
                      }}>
                        Priority: {fu.priority}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outcome */}
          {insights.outcome && (
            <div style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4a90e2" }}>
                🎯 Outcome
              </h3>
              <div style={{
                marginTop: "8px",
                padding: "8px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                fontSize: "13px"
              }}>
                {insights.outcome}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
