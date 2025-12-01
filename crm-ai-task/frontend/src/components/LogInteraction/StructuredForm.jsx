import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export default function StructuredForm() {
  const [formData, setFormData] = useState({
    hcp_name: '',
    hcp_id: '',
    datetime: new Date().toISOString().slice(0, 16),
    interaction_type: 'meeting',
    summary: '',
    sentiment: 'neutral',
    materials: [{ material_type: '', quantity: 0, notes: '' }],
    samples: [{ product_code: '', quantity: 0, lot: '' }],
    follow_ups: [{ action_item: '', due_date: '', owner: '', status: 'open' }],
    topics: '',
    outcome: ''
  });

  const [hcps, setHcps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Search HCPs
  useEffect(() => {
    if (searchQuery.length > 2) {
      axios.get(`${API_BASE}/hcps/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => setHcps(res.data))
        .catch(err => console.error('HCP search error:', err));
    } else {
      setHcps([]);
    }
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName, template) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], template]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Prepare data
      const payload = {
        hcp_id: formData.hcp_id || null,
        rep_id: 'rep_001',
        mode: 'structured',
        datetime: formData.datetime,
        summary: formData.summary,
        sentiment: formData.sentiment,
        topics: formData.topics ? formData.topics.split(',').map(t => t.trim()) : [],
        outcome: formData.outcome,
        materials: formData.materials.filter(m => m.material_type),
        samples: formData.samples.filter(s => s.product_code),
        follow_ups: formData.follow_ups.filter(f => f.action_item)
      };

      // If HCP name provided but no ID, create HCP first
      if (formData.hcp_name && !formData.hcp_id) {
        const hcpRes = await axios.post(`${API_BASE}/hcps`, {
          name: formData.hcp_name,
          title: '',
          speciality: '',
          organisation: ''
        });
        payload.hcp_id = hcpRes.data.id;
      }

      const response = await axios.post(`${API_BASE}/interactions`, payload);
      setMessage('✅ Interaction logged successfully!');
      console.log('Created interaction:', response.data);
      
      // Reset form
      setFormData({
        hcp_name: '',
        hcp_id: '',
        datetime: new Date().toISOString().slice(0, 16),
        interaction_type: 'meeting',
        summary: '',
        sentiment: 'neutral',
        materials: [{ material_type: '', quantity: 0, notes: '' }],
        samples: [{ product_code: '', quantity: 0, lot: '' }],
        follow_ups: [{ action_item: '', due_date: '', owner: '', status: 'open' }],
        topics: '',
        outcome: ''
      });
    } catch (error) {
      setMessage('❌ Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const selectHCP = (hcp) => {
    setFormData(prev => ({ ...prev, hcp_id: hcp.id, hcp_name: hcp.name }));
    setHcps([]);
    setSearchQuery('');
  };

  return (
    <div style={{
      border: "2px solid #4a90e2",
      borderRadius: "8px",
      padding: "24px",
      width: "100%",
      maxWidth: "600px",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Inter', sans-serif"
    }}>
      <h2 style={{ marginTop: 0, color: "#2c3e50" }}>📋 Structured Form</h2>
      
      <form onSubmit={handleSubmit}>
        {/* HCP Name */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            HCP Name *
          </label>
          <input
            type="text"
            value={formData.hcp_name}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFormData(prev => ({ ...prev, hcp_name: e.target.value }));
            }}
            placeholder="Search or enter HCP name"
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          />
          {hcps.length > 0 && (
            <div style={{
              position: "absolute",
              zIndex: 1000,
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
              maxHeight: "200px",
              overflowY: "auto",
              width: "calc(100% - 48px)",
              marginTop: "4px"
            }}>
              {hcps.map(hcp => (
                <div
                  key={hcp.id}
                  onClick={() => selectHCP(hcp)}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                >
                  {hcp.name} {hcp.title && `- ${hcp.title}`}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Date & Time *
          </label>
          <input
            type="datetime-local"
            name="datetime"
            value={formData.datetime}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Interaction Type */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Interaction Type
          </label>
          <select
            name="interaction_type"
            value={formData.interaction_type}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          >
            <option value="meeting">Meeting</option>
            <option value="call">Phone Call</option>
            <option value="email">Email</option>
            <option value="event">Event</option>
          </select>
        </div>

        {/* Discussion Summary */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Discussion Summary *
          </label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            required
            rows="4"
            placeholder="Enter summary of discussion..."
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </div>

        {/* Sentiment */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Sentiment
          </label>
          <select
            name="sentiment"
            value={formData.sentiment}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          >
            <option value="positive">😊 Positive</option>
            <option value="neutral">😐 Neutral</option>
            <option value="negative">😞 Negative</option>
          </select>
        </div>

        {/* Topics */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Topics (comma-separated)
          </label>
          <input
            type="text"
            name="topics"
            value={formData.topics}
            onChange={handleInputChange}
            placeholder="e.g., Product X, Pricing, Clinical Data"
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Materials Shared */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
            Materials Shared
          </label>
          {formData.materials.map((material, index) => (
            <div key={index} style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Material type"
                value={material.material_type}
                onChange={(e) => handleArrayChange('materials', index, 'material_type', e.target.value)}
                style={{ flex: 2, padding: "6px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <input
                type="number"
                placeholder="Qty"
                value={material.quantity}
                onChange={(e) => handleArrayChange('materials', index, 'quantity', parseInt(e.target.value) || 0)}
                style={{ flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              {formData.materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('materials', index)}
                  style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('materials', { material_type: '', quantity: 0, notes: '' })}
            style={{ padding: "6px 12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
          >
            + Add Material
          </button>
        </div>

        {/* Samples Given */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
            Samples Given
          </label>
          {formData.samples.map((sample, index) => (
            <div key={index} style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Product code"
                value={sample.product_code}
                onChange={(e) => handleArrayChange('samples', index, 'product_code', e.target.value)}
                style={{ flex: 2, padding: "6px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <input
                type="number"
                placeholder="Qty"
                value={sample.quantity}
                onChange={(e) => handleArrayChange('samples', index, 'quantity', parseInt(e.target.value) || 0)}
                style={{ flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              {formData.samples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('samples', index)}
                  style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('samples', { product_code: '', quantity: 0, lot: '' })}
            style={{ padding: "6px 12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
          >
            + Add Sample
          </button>
        </div>

        {/* Follow-ups */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
            Follow-ups
          </label>
          {formData.follow_ups.map((followup, index) => (
            <div key={index} style={{ marginBottom: "8px" }}>
              <input
                type="text"
                placeholder="Action item"
                value={followup.action_item}
                onChange={(e) => handleArrayChange('follow_ups', index, 'action_item', e.target.value)}
                style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ddd", marginBottom: "4px" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="date"
                  placeholder="Due date"
                  value={followup.due_date}
                  onChange={(e) => handleArrayChange('follow_ups', index, 'due_date', e.target.value)}
                  style={{ flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
                {formData.follow_ups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('follow_ups', index)}
                    style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('follow_ups', { action_item: '', due_date: '', owner: '', status: 'open' })}
            style={{ padding: "6px 12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
          >
            + Add Follow-up
          </button>
        </div>

        {/* Outcome */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
            Outcome
          </label>
          <textarea
            name="outcome"
            value={formData.outcome}
            onChange={handleInputChange}
            rows="3"
            placeholder="Any outcomes or decisions..."
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </div>

        {message && (
          <div style={{
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
            backgroundColor: message.includes('✅') ? "#d4edda" : "#f8d7da",
            color: message.includes('✅') ? "#155724" : "#721c24"
          }}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#6c757d" : "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Submitting..." : "📝 Log Interaction"}
        </button>
      </form>
    </div>
  );
}
