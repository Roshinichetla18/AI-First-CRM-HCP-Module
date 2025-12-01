from . import schemas
from datetime import datetime
from typing import List, Optional
import uuid

# In-memory storage
_hcps = {}
_interactions = {}
_materials = {}
_samples = {}
_follow_ups = {}

# HCP CRUD
def get_hcp_by_id(hcp_id: str):
    return _hcps.get(hcp_id)

def search_hcp_by_name(name: str, limit: int = 10):
    name_lower = name.lower()
    results = [
        hcp for hcp in _hcps.values()
        if name_lower in hcp["name"].lower()
    ]
    return results[:limit]

def create_hcp(hcp_in: schemas.HCPCreate):
    hcp_id = str(uuid.uuid4())
    now = datetime.utcnow()
    hcp = {
        "id": hcp_id,
        "name": hcp_in.name,
        "title": hcp_in.title,
        "speciality": hcp_in.speciality,
        "organisation": hcp_in.organisation,
        "contact": hcp_in.contact,
        "created_at": now,
        "updated_at": now
    }
    _hcps[hcp_id] = hcp
    return hcp

# Interaction CRUD
def get_interaction(interaction_id: str):
    inter = _interactions.get(interaction_id)
    if not inter:
        return None
    
    # Attach related data
    inter = inter.copy()
    inter["materials"] = [m for m in _materials.values() if m["interaction_id"] == interaction_id]
    inter["samples"] = [s for s in _samples.values() if s["interaction_id"] == interaction_id]
    inter["follow_ups"] = [f for f in _follow_ups.values() if f["interaction_id"] == interaction_id]
    return inter

def create_interaction(interaction_in: schemas.InteractionCreate):
    interaction_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    inter = {
        "id": interaction_id,
        "hcp_id": interaction_in.hcp_id,
        "rep_id": interaction_in.rep_id,
        "mode": interaction_in.mode or "conversational",
        "datetime": interaction_in.datetime,
        "summary": interaction_in.summary,
        "sentiment": interaction_in.sentiment.value if interaction_in.sentiment else None,
        "topics": interaction_in.topics,
        "outcome": interaction_in.outcome,
        "source_raw": interaction_in.source_raw,
        "created_at": now,
        "updated_at": now,
        "materials": [],
        "samples": [],
        "follow_ups": []
    }
    _interactions[interaction_id] = inter

    # materials
    materials = []
    for m in interaction_in.materials or []:
        mat_id = str(uuid.uuid4())
        mat = {
            "id": mat_id,
            "interaction_id": interaction_id,
            "material_type": m.material_type,
            "quantity": m.quantity,
            "notes": m.notes
        }
        _materials[mat_id] = mat
        materials.append(mat)

    # samples
    samples = []
    for s in interaction_in.samples or []:
        samp_id = str(uuid.uuid4())
        samp = {
            "id": samp_id,
            "interaction_id": interaction_id,
            "product_code": s.product_code,
            "quantity": s.quantity,
            "lot": s.lot
        }
        _samples[samp_id] = samp
        samples.append(samp)

    # followups
    follow_ups = []
    for f in interaction_in.follow_ups or []:
        fu_id = str(uuid.uuid4())
        fu = {
            "id": fu_id,
            "interaction_id": interaction_id,
            "due_date": f.due_date,
            "action_item": f.action_item,
            "owner": f.owner,
            "status": f.status or "open"
        }
        _follow_ups[fu_id] = fu
        follow_ups.append(fu)
    
    inter["materials"] = materials
    inter["samples"] = samples
    inter["follow_ups"] = follow_ups
    return inter

def update_interaction(interaction_id: str, patch: dict):
    inter = _interactions.get(interaction_id)
    if not inter:
        return None
    
    for k, v in patch.items():
        if k in inter and k not in ["id", "created_at"]:
            inter[k] = v
    
    inter["updated_at"] = datetime.utcnow()
    
    # Return with related data
    return get_interaction(interaction_id)
