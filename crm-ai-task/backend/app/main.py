from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from . import schemas, crud
from .agent_service import process_conversational_input, edit_interaction_via_agent

app = FastAPI(title="AI-CRM Backend (Task1)")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is running!", "storage": "in-memory"}

# HCP endpoints
@app.post("/api/hcps", response_model=schemas.HCP)
def create_hcp(hcp_in: schemas.HCPCreate):
    return crud.create_hcp(hcp_in)

@app.get("/api/hcps/search", response_model=list[schemas.HCP])
def search_hcp(q: str):
    results = crud.search_hcp_by_name(q)
    return results

@app.get("/api/hcps/{hcp_id}", response_model=schemas.HCP)
def get_hcp(hcp_id: str):
    h = crud.get_hcp_by_id(hcp_id)
    if not h:
        raise HTTPException(status_code=404, detail="HCP not found")
    return h

# Interaction endpoints
@app.post("/api/interactions", response_model=schemas.Interaction)
def create_interaction(inter_in: schemas.InteractionCreate):
    inter = crud.create_interaction(inter_in)
    return inter

@app.get("/api/interactions/{interaction_id}", response_model=schemas.Interaction)
def get_interaction(interaction_id: str):
    inter = crud.get_interaction(interaction_id)
    if not inter:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return inter

@app.patch("/api/interactions/{interaction_id}", response_model=schemas.Interaction)
def patch_interaction(interaction_id: str, patch: dict):
    updated = crud.update_interaction(interaction_id, patch)
    if not updated:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return updated

# AI Agent endpoints
class ConversationalInput(BaseModel):
    text: str
    rep_id: Optional[str] = "default_rep"

class EditRequest(BaseModel):
    edit_request: str
    rep_id: Optional[str] = "default_rep"

@app.post("/api/agent/conversational")
def process_conversation(input_data: ConversationalInput):
    """Process conversational input through LangGraph agent"""
    result = process_conversational_input(input_data.text, input_data.rep_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Processing failed"))
    return result

@app.post("/api/agent/edit/{interaction_id}")
def edit_interaction_agent(interaction_id: str, request: EditRequest):
    """Edit interaction using natural language"""
    result = edit_interaction_via_agent(interaction_id, request.edit_request)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Edit failed"))
    return result
