import StructuredForm from "./components/LogInteraction/StructuredForm";
import ConversationalPanel from "./components/LogInteraction/ConversationalPanel";
import AssistantPanel from "./components/LogInteraction/AssistantPanel";

function App() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      fontFamily: "'Inter', sans-serif"
    }}>
      <header style={{
        backgroundColor: "#2c3e50",
        color: "white",
        padding: "20px",
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 600 }}>
          🤖 AI-CRM: HCP Interaction Logging System
        </h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: "14px" }}>
          Log interactions with Healthcare Professionals using Structured Forms or Conversational AI
        </p>
      </header>
      
      <div style={{
        display: "flex",
        gap: "24px",
        padding: "24px",
        justifyContent: "center",
        flexWrap: "wrap",
        maxWidth: "1800px",
        margin: "0 auto"
      }}>
        <StructuredForm />
        <ConversationalPanel />
        <AssistantPanel />
      </div>
    </div>
  );
}

export default App;
