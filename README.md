# AI-First-CRM-HCP-Module

# AI-CRM: HCP Interaction Logging System

A full-stack CRM module for medical reps to record interactions with Healthcare Professionals (HCPs) using both structured forms and conversational AI.

## 🚀 Quick Start

### Prerequisites

- Python 3.13+
- Node.js 18+
- Groq API Key (get one free at https://console.groq.com/)

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   - A `.env` file has been created in the `backend/` directory
   - Open `backend/.env` and add your Groq API key:
     ```
     GROQ_API_KEY=your_actual_api_key_here
     ```
   - Get your free API key from: https://console.groq.com/

5. **Start the backend server:**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`
   API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000`

## 📋 Features

### 1. Structured Form Mode

- Complete form with all required fields:
  - HCP Name (with search)
  - Date & Time
  - Interaction Type
  - Discussion Summary
  - Materials Shared
  - Samples Given
  - Sentiment Analysis
  - Topics
  - Follow-ups
  - Outcome

### 2. Conversational AI Mode

- Natural language input (text or voice)
- Automatic entity extraction:
  - HCP name
  - Date/time
  - Summary
  - Materials and samples
  - Topics and outcomes
- Sentiment analysis
- Follow-up suggestions
- Auto-fills structured form

### 3. AI Assistant Panel

- Real-time display of extracted information
- Sentiment visualization
- Materials and samples summary
- Suggested follow-up actions

## 🔧 API Endpoints

### HCP Endpoints

- `POST /api/hcps` - Create HCP
- `GET /api/hcps/search?q=name` - Search HCPs
- `GET /api/hcps/{hcp_id}` - Get HCP by ID

### Interaction Endpoints

- `POST /api/interactions` - Create interaction
- `GET /api/interactions/{interaction_id}` - Get interaction
- `PATCH /api/interactions/{interaction_id}` - Update interaction

### AI Agent Endpoints

- `POST /api/agent/conversational` - Process conversational input
- `POST /api/agent/edit/{interaction_id}` - Edit interaction via AI

## 🛠️ Technology Stack

### Frontend

- React 19
- Redux Toolkit
- Axios
- Google Inter font

### Backend

- FastAPI
- Python 3.13
- LangGraph (agent orchestration)
- Groq LLM (llama-3.1-8b-instant)
- In-memory storage (SQLite/PostgreSQL ready)

### AI Layer

- LangGraph for agent workflow
- Groq LLM for natural language processing
- 5 Tools: log_interaction, edit_interaction, search_hcp, sentiment_analyzer, followup_suggestor

## 📝 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

## 🐛 Troubleshooting

### "GROQ_API_KEY not set" Error

1. Make sure you've created a `.env` file in the `backend/` directory
2. Add your API key: `GROQ_API_KEY=your_key_here`
3. Restart the backend server

### Import Errors

- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Ensure you're using the virtual environment: `source .venv/bin/activate`

### Frontend Not Connecting to Backend

- Check that backend is running on `http://localhost:8000`
- Verify CORS is enabled (it should be by default)
- Check browser console for errors

## 📚 Project Structure

```
crm-ai/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── agent_service.py  # LangGraph agent service
│   │   ├── crud.py           # CRUD operations
│   │   ├── schemas.py        # Pydantic schemas
│   │   └── models.py         # Data models
│   ├── .env                  # Environment variables
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── LogInteraction/
│   │   │       ├── StructuredForm.jsx
│   │   │       ├── ConversationalPanel.jsx
│   │   │       └── AssistantPanel.jsx
│   │   └── App.js
│   └── package.json
└── langgraph/
    └── tools/
        └── agent.py          # LangGraph agent definition
```

## 🎯 Next Steps

1. **Get your Groq API Key:**

   - Visit https://console.groq.com/
   - Sign up for free
   - Create an API key
   - Add it to `backend/.env`

2. **Test the application:**

   - Start both backend and frontend
   - Try the structured form
   - Try conversational mode: "Met Dr. Rohan at 4pm, discussed Product X, gave 2 samples"

3. **Database Integration (Future):**
   - Currently using in-memory storage
   - Ready for SQLite or PostgreSQL integration

## 📄 License

This project is part of a technical assessment.
