"""
Agent service to handle LangGraph agent interactions
"""
import sys
import os
import importlib.util

# Import agent functions directly from file path to avoid package conflicts
agent_path = os.path.join(os.path.dirname(__file__), '../../langgraph/tools/agent.py')
spec = importlib.util.spec_from_file_location("agent_module", agent_path)
agent_module = importlib.util.module_from_spec(spec)
sys.modules["agent_module"] = agent_module
spec.loader.exec_module(agent_module)

from langchain_core.messages import HumanMessage
from datetime import datetime
from typing import Optional
import json

# Import CRUD functions
from . import crud, schemas

# Get functions from agent module
create_agent = agent_module.create_agent
tools = agent_module.tools

def process_conversational_input(user_input: str, rep_id: str = "default_rep") -> dict:
    """
    Process conversational input through LangGraph agent
    
    Args:
        user_input: User's conversational text
        rep_id: Representative ID
    
    Returns:
        dict with extracted data, sentiment, follow-ups, and response
    """
    # Check for API key first
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY", "")
    
    if not api_key:
        return {
            "success": False,
            "error": "GROQ_API_KEY environment variable is not set. Please create a .env file in the backend directory with: GROQ_API_KEY=your_api_key_here",
            "extracted_data": {},
            "ai_response": "⚠️ AI features require GROQ_API_KEY. Please set it in your .env file. Get your key from: https://console.groq.com/"
        }
    
    try:
        # Create agent
        agent = create_agent()
        
        # Initialize state
        initial_state = {
            "messages": [HumanMessage(content=user_input)],
            "extracted_data": {},
            "interaction_id": None,
            "crud_functions": {
                "create_interaction": crud.create_interaction,
                "search_hcp": crud.search_hcp_by_name,
                "get_hcp": crud.get_hcp_by_id
            }
        }
        
        # Run agent
        try:
            result = agent.invoke(initial_state)
        except Exception as agent_error:
            print(f"Agent error: {agent_error}")
            # Fallback: use direct LLM extraction if agent fails
            from langchain_groq import ChatGroq
            
            # Check API key again for fallback
            if not api_key:
                raise ValueError("GROQ_API_KEY not set")
            
            try:
                llm = ChatGroq(model="llama-3.1-8b-instant", groq_api_key=api_key)
            except Exception as llm_error:
                return {
                    "success": False,
                    "error": f"Failed to initialize LLM: {str(llm_error)}",
                    "extracted_data": {},
                    "ai_response": "⚠️ Could not connect to Groq API. Please check your API key."
                }
            extraction_prompt = f"""Extract the following information from this text and return ONLY valid JSON:
- hcp_name: Name of the healthcare professional
- datetime: Date and time (ISO format if available)
- summary: Summary of discussion
- materials: Array of {{"material_type": str, "quantity": int}} if mentioned
- samples: Array of {{"product_code": str, "quantity": int}} if mentioned
- topics: Array of discussion topics
- outcome: Any outcomes or decisions

Text: {user_input}

Return JSON:"""
            
            response = llm.invoke([HumanMessage(content=extraction_prompt)])
            try:
                extracted = json.loads(response.content)
            except:
                extracted = {"hcp_name": "", "summary": user_input, "materials": [], "samples": [], "topics": []}
            
            # Analyze sentiment
            sentiment_prompt = f"Analyze sentiment (positive/neutral/negative) of: {extracted.get('summary', user_input)}. Return only the word."
            sentiment_resp = llm.invoke([HumanMessage(content=sentiment_prompt)])
            extracted["sentiment"] = sentiment_resp.content.lower().strip().split()[0] if sentiment_resp.content else "neutral"
            if extracted["sentiment"] not in ["positive", "neutral", "negative"]:
                extracted["sentiment"] = "neutral"
            
            # Suggest follow-ups
            followup_prompt = f"Suggest 2 follow-up actions for: {extracted.get('summary', user_input)}. Return JSON array with 'action_item' and 'priority'."
            followup_resp = llm.invoke([HumanMessage(content=followup_prompt)])
            try:
                extracted["suggested_follow_ups"] = json.loads(followup_resp.content)
            except:
                extracted["suggested_follow_ups"] = [{"action_item": "Follow up on discussed topics", "priority": "medium"}]
            
            ai_response = f"Extracted information:\n- HCP: {extracted.get('hcp_name', 'Not specified')}\n- Summary: {extracted.get('summary', 'N/A')}\n- Sentiment: {extracted.get('sentiment', 'neutral')}"
            from langchain_core.messages import AIMessage
            result = {"extracted_data": extracted, "messages": [HumanMessage(content=user_input), AIMessage(content=ai_response)]}
        
        # Extract results
        extracted = result.get("extracted_data", {})
        messages = result.get("messages", [])
        
        # Get AI response from messages
        ai_response = "Processing complete"
        for msg in reversed(messages):
            if hasattr(msg, 'content'):
                from langchain_core.messages import HumanMessage as HM
                if not isinstance(msg, HM):
                    ai_response = msg.content
                    break
        
        # Try to find or create HCP
        hcp_id = None
        hcp_name = extracted.get("hcp_name", "")
        if hcp_name:
            # Search for existing HCP
            existing_hcps = crud.search_hcp_by_name(hcp_name, limit=1)
            if existing_hcps:
                hcp_id = existing_hcps[0]["id"]
            else:
                # Create new HCP
                new_hcp = crud.create_hcp(schemas.HCPCreate(
                    name=hcp_name,
                    title=extracted.get("title"),
                    speciality=extracted.get("speciality"),
                    organisation=extracted.get("organisation")
                ))
                hcp_id = new_hcp["id"]
        
        # Prepare interaction data
        interaction_data = {
            "hcp_id": hcp_id,
            "rep_id": rep_id,
            "mode": "conversational",
            "datetime": extracted.get("datetime"),
            "summary": extracted.get("summary"),
            "sentiment": extracted.get("sentiment"),
            "topics": extracted.get("topics", []),
            "outcome": extracted.get("outcome"),
            "source_raw": user_input,
            "materials": [schemas.MaterialSharedCreate(**m) for m in extracted.get("materials", [])],
            "samples": [schemas.SampleCreate(**s) for s in extracted.get("samples", [])],
            "follow_ups": []
        }
        
        # Add suggested follow-ups
        for sug_fu in extracted.get("suggested_follow_ups", []):
            interaction_data["follow_ups"].append(schemas.FollowUpCreate(
                action_item=sug_fu.get("action_item", ""),
                owner=rep_id,
                status="open"
            ))
        
        # Create interaction
        created_interaction = crud.create_interaction(schemas.InteractionCreate(**interaction_data))
        
        return {
            "success": True,
            "extracted_data": extracted,
            "ai_response": ai_response,
            "interaction": created_interaction,
            "sentiment": extracted.get("sentiment", "neutral"),
            "suggested_follow_ups": extracted.get("suggested_follow_ups", [])
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "extracted_data": {},
            "ai_response": f"Error processing: {str(e)}"
        }

def edit_interaction_via_agent(interaction_id: str, edit_request: str) -> dict:
    """
    Edit an interaction using natural language
    
    Args:
        interaction_id: ID of interaction to edit
        edit_request: Natural language edit request
    
    Returns:
        Updated interaction
    """
    try:
        # Get existing interaction
        existing = crud.get_interaction(interaction_id)
        if not existing:
            return {"success": False, "error": "Interaction not found"}
        
        # Use LLM to parse edit request
        from langchain_groq import ChatGroq
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        llm = ChatGroq(model="llama-3.1-8b-instant", groq_api_key=os.getenv("GROQ_API_KEY", ""))
        
        prompt = f"""Given this interaction data and an edit request, return ONLY a JSON object with fields to update:

Current Interaction:
{json.dumps(existing, default=str)}

Edit Request: {edit_request}

Return JSON with only fields to update:"""
        
        response = llm.invoke([HumanMessage(content=prompt)])
        
        try:
            updates = json.loads(response.content)
            # Update interaction
            updated = crud.update_interaction(interaction_id, updates)
            return {"success": True, "interaction": updated}
        except:
            return {"success": False, "error": "Could not parse edit request"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

