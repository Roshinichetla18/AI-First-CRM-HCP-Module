import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export default function ConversationalPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I can help you log interactions with HCPs. Just tell me what happened, like:\n\n"Met Dr. Rohan at 4pm, discussed Product X, gave 2 samples."\n\nI\'ll extract all the details and log it for you!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/agent/conversational`, {
        text: userMessage,
        rep_id: 'rep_001'
      });

      if (response.data.success) {
        const aiResponse = response.data.ai_response;
        const extracted = response.data.extracted_data;
        
        // Add AI response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
          extractedData: extracted,
          interaction: response.data.interaction
        }]);

        // Notify AssistantPanel of extracted data
        if (extracted) {
          // Dispatch custom event
          const event = new CustomEvent('extractedData', {
            detail: { extractedData: extracted, interaction: response.data.interaction }
          });
          window.dispatchEvent(event);
          
          // Also set window property for backward compatibility
          if (window.onExtractedData) {
            window.onExtractedData(extracted);
          }
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error: ${response.data.error || 'Failed to process'}`
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.response?.data?.detail || error.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }
  };

  return (
    <div style={{
      border: "2px solid #28a745",
      borderRadius: "8px",
      padding: "24px",
      width: "100%",
      maxWidth: "600px",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      height: "80vh",
      maxHeight: "800px"
    }}>
      <h2 style={{ marginTop: 0, color: "#2c3e50" }}>💬 Conversational AI</h2>
      
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        marginBottom: "16px",
        padding: "12px",
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e0e0e0"
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor: msg.role === 'user' ? "#4a90e2" : "#e9ecef",
              color: msg.role === 'user' ? "white" : "#2c3e50",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              {msg.content}
              {msg.extractedData && (
                <div style={{
                  marginTop: "12px",
                  padding: "8px",
                  backgroundColor: msg.role === 'user' ? "rgba(255,255,255,0.2)" : "#d4edda",
                  borderRadius: "6px",
                  fontSize: "12px"
                }}>
                  <strong>📋 Extracted:</strong>
                  <div style={{ marginTop: "4px" }}>
                    {msg.extractedData.hcp_name && <div>👤 HCP: {msg.extractedData.hcp_name}</div>}
                    {msg.extractedData.sentiment && <div>😊 Sentiment: {msg.extractedData.sentiment}</div>}
                    {msg.extractedData.materials?.length > 0 && (
                      <div>📄 Materials: {msg.extractedData.materials.length} item(s)</div>
                    )}
                    {msg.extractedData.samples?.length > 0 && (
                      <div>💊 Samples: {msg.extractedData.samples.length} item(s)</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: "16px"
          }}>
            <div style={{
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor: "#e9ecef",
              color: "#2c3e50"
            }}>
              🤔 Processing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        display: "flex",
        gap: "8px",
        alignItems: "flex-end"
      }}>
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your interaction or use voice input..."
            rows="2"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              paddingRight: "40px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "none",
              outline: "none"
            }}
          />
          <button
            onClick={startRecording}
            disabled={loading || isRecording}
            style={{
              position: "absolute",
              right: "8px",
              bottom: "8px",
              backgroundColor: isRecording ? "#dc3545" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px"
            }}
            title="Voice input"
          >
            {isRecording ? "⏹" : "🎤"}
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: loading || !input.trim() ? "#6c757d" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap"
          }}
        >
          {loading ? "⏳" : "📤 Send"}
        </button>
      </div>

      <div style={{
        marginTop: "8px",
        fontSize: "12px",
        color: "#6c757d",
        textAlign: "center"
      }}>
        💡 Try: "Met Dr. Patel at 3pm, discussed Product X benefits, gave 2 samples of ABC-123"
      </div>
    </div>
  );
}
