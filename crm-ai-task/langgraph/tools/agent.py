from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from typing import TypedDict, Annotated, List
from datetime import datetime
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq LLM (lazy initialization)
llm = None

def get_llm():
    """Get or create LLM instance"""
    global llm
    if llm is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.7,
            groq_api_key=api_key
        )
    return llm

# Import CRUD functions (will be passed as context)
# For now, we'll create a state that can hold the CRUD functions

class AgentState(TypedDict):
    messages: Annotated[List, "messages"]
    extracted_data: dict
    interaction_id: str | None
    crud_functions: dict  # Will hold references to CRUD functions

# ==================== TOOLS ====================

@tool
def log_interaction(
    hcp_name: str,
    datetime_str: str = None,
    summary: str = None,
    sentiment: str = None,
    materials: List[dict] = None,
    samples: List[dict] = None,
    follow_ups: List[dict] = None,
    hcp_id: str = None,
    rep_id: str = "default_rep",
    topics: List[str] = None,
    outcome: str = None
) -> dict:
    """
    Log a structured interaction with an HCP.
    
    Args:
        hcp_name: Name of the Healthcare Professional
        datetime_str: Date and time of interaction (ISO format)
        summary: Summary of the discussion
        sentiment: positive, neutral, or negative
        materials: List of materials shared [{"material_type": str, "quantity": int, "notes": str}]
        samples: List of samples given [{"product_code": str, "quantity": int, "lot": str}]
        follow_ups: List of follow-up actions [{"action_item": str, "due_date": str, "owner": str}]
        hcp_id: Optional HCP ID if already exists
        rep_id: Representative ID
        topics: List of discussion topics
        outcome: Outcome of the interaction
    
    Returns:
        dict: Created interaction with ID
    """
    # This will be called from the agent with CRUD functions in state
    return {"status": "logged", "message": "Interaction logged successfully"}

@tool
def edit_interaction(
    interaction_id: str,
    updates: dict
) -> dict:
    """
    Edit an existing interaction.
    
    Args:
        interaction_id: ID of the interaction to edit
        updates: Dictionary of fields to update
    
    Returns:
        dict: Updated interaction
    """
    return {"status": "updated", "message": f"Interaction {interaction_id} updated"}

@tool
def search_hcp(name: str) -> List[dict]:
    """
    Search for HCPs by name.
    
    Args:
        name: Name or partial name to search
    
    Returns:
        List of matching HCPs with their details
    """
    return []

@tool
def sentiment_analyzer(text: str) -> dict:
    """
    Analyze sentiment from text.
    
    Args:
        text: Text to analyze
    
    Returns:
        dict with sentiment (positive/neutral/negative) and confidence
    """
    # Use LLM to analyze sentiment
    prompt = f"""Analyze the sentiment of this text and return ONLY a JSON object with "sentiment" (positive/neutral/negative) and "confidence" (0-1):
    
Text: {text}

JSON:"""
    
    response = get_llm().invoke([HumanMessage(content=prompt)])
    try:
        result = json.loads(response.content)
        return result
    except:
        # Fallback parsing
        content = response.content.lower()
        if "positive" in content:
            return {"sentiment": "positive", "confidence": 0.8}
        elif "negative" in content:
            return {"sentiment": "negative", "confidence": 0.8}
        else:
            return {"sentiment": "neutral", "confidence": 0.7}

@tool
def followup_suggestor(summary: str, sentiment: str = None) -> List[dict]:
    """
    Suggest follow-up actions based on interaction summary.
    
    Args:
        summary: Summary of the interaction
        sentiment: Optional sentiment (positive/neutral/negative)
    
    Returns:
        List of suggested follow-up actions
    """
    prompt = f"""Based on this interaction summary, suggest 2-3 specific follow-up actions. Return ONLY a JSON array of objects with "action_item" (string) and "priority" (high/medium/low):

Summary: {summary}
Sentiment: {sentiment or "unknown"}

JSON:"""
    
    response = get_llm().invoke([HumanMessage(content=prompt)])
    try:
        result = json.loads(response.content)
        if isinstance(result, list):
            return result
        else:
            return [{"action_item": "Follow up on discussed topics", "priority": "medium"}]
    except:
        return [
            {"action_item": "Schedule next meeting", "priority": "medium"},
            {"action_item": "Send requested materials", "priority": "high" if sentiment == "positive" else "low"}
        ]

# ==================== AGENT NODES ====================

def extract_entities(state: AgentState):
    """Extract entities from user message using LLM"""
    messages = state["messages"]
    last_message = messages[-1].content if messages else ""
    
    extraction_prompt = f"""Extract the following information from this text and return ONLY valid JSON:
- hcp_name: Name of the healthcare professional
- datetime: Date and time (ISO format if available)
- summary: Summary of discussion
- materials: Array of {{"material_type": str, "quantity": int}} if mentioned
- samples: Array of {{"product_code": str, "quantity": int}} if mentioned
- topics: Array of discussion topics
- outcome: Any outcomes or decisions

Text: {last_message}

Return JSON:"""
    
    response = get_llm().invoke([SystemMessage(content="You are an expert at extracting structured data from medical rep conversations."), 
                           HumanMessage(content=extraction_prompt)])
    
    try:
        extracted = json.loads(response.content)
        state["extracted_data"] = extracted
    except:
        # Fallback extraction
        state["extracted_data"] = {
            "hcp_name": "",
            "summary": last_message,
            "materials": [],
            "samples": [],
            "topics": [],
            "outcome": None
        }
    
    return state

def analyze_sentiment_node(state: AgentState):
    """Analyze sentiment from extracted summary"""
    extracted = state.get("extracted_data", {})
    summary = extracted.get("summary", "")
    
    if summary:
        sentiment_result = sentiment_analyzer.invoke({"text": summary})
        extracted["sentiment"] = sentiment_result.get("sentiment", "neutral")
        state["extracted_data"] = extracted
    
    return state

def suggest_followups_node(state: AgentState):
    """Generate follow-up suggestions"""
    extracted = state.get("extracted_data", {})
    summary = extracted.get("summary", "")
    sentiment = extracted.get("sentiment", "neutral")
    
    if summary:
        followups = followup_suggestor.invoke({"summary": summary, "sentiment": sentiment})
        extracted["suggested_follow_ups"] = followups
        state["extracted_data"] = extracted
    
    return state

def log_interaction_node(state: AgentState):
    """Log the interaction using the log_interaction tool"""
    extracted = state.get("extracted_data", {})
    crud_funcs = state.get("crud_functions", {})
    
    # This will be handled by the API endpoint that has access to CRUD
    state["interaction_id"] = "pending"
    
    return state

def generate_response(state: AgentState):
    """Generate final response to user"""
    extracted = state.get("extracted_data", {})
    
    response_text = f"""I've extracted the following information:

**HCP:** {extracted.get('hcp_name', 'Not specified')}
**Summary:** {extracted.get('summary', 'No summary')}
**Sentiment:** {extracted.get('sentiment', 'neutral').title()}
**Topics:** {', '.join(extracted.get('topics', [])) or 'None'}
**Materials:** {len(extracted.get('materials', []))} item(s)
**Samples:** {len(extracted.get('samples', []))} item(s)

"""
    
    if extracted.get("suggested_follow_ups"):
        response_text += "\n**Suggested Follow-ups:**\n"
        for i, fu in enumerate(extracted.get("suggested_follow_ups", []), 1):
            response_text += f"{i}. {fu.get('action_item', 'N/A')} ({fu.get('priority', 'medium')} priority)\n"
    
    state["messages"].append(AIMessage(content=response_text))
    return state

# ==================== GRAPH DEFINITION ====================

def create_agent():
    """Create the LangGraph agent"""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("extract_entities", extract_entities)
    workflow.add_node("analyze_sentiment", analyze_sentiment_node)
    workflow.add_node("suggest_followups", suggest_followups_node)
    workflow.add_node("log_interaction", log_interaction_node)
    workflow.add_node("generate_response", generate_response)
    
    # Set entry point
    workflow.set_entry_point("extract_entities")
    
    # Add edges
    workflow.add_edge("extract_entities", "analyze_sentiment")
    workflow.add_edge("analyze_sentiment", "suggest_followups")
    workflow.add_edge("suggest_followups", "log_interaction")
    workflow.add_edge("log_interaction", "generate_response")
    workflow.add_edge("generate_response", END)
    
    return workflow.compile()

# Export tools for use in API
tools = [log_interaction, edit_interaction, search_hcp, sentiment_analyzer, followup_suggestor]
