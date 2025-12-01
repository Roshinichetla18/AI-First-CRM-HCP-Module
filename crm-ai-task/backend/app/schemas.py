from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime as dt
from enum import Enum

class Sentiment(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

class MaterialSharedCreate(BaseModel):
    material_type: str
    quantity: int = 0
    notes: Optional[str] = None

class MaterialShared(MaterialSharedCreate):
    id: str
    interaction_id: str
    
    class Config:
        from_attributes = True

class SampleCreate(BaseModel):
    product_code: str
    quantity: int = 0
    lot: Optional[str] = None

class Sample(SampleCreate):
    id: str
    interaction_id: str
    
    class Config:
        from_attributes = True

class FollowUpCreate(BaseModel):
    due_date: Optional[dt] = None
    action_item: str
    owner: Optional[str] = None
    status: Optional[str] = "open"

class FollowUp(FollowUpCreate):
    id: str
    interaction_id: str
    
    class Config:
        from_attributes = True

class HCPBase(BaseModel):
    name: str
    title: Optional[str] = None
    speciality: Optional[str] = None
    organisation: Optional[str] = None
    contact: Optional[Any] = None

class HCPCreate(HCPBase):
    pass

class HCP(HCPBase):
    id: str
    created_at: Optional[dt]
    updated_at: Optional[dt]

    class Config:
        from_attributes = True

class InteractionBase(BaseModel):
    hcp_id: Optional[str] = None
    rep_id: Optional[str] = None
    mode: Optional[str] = "conversational"
    datetime: Optional[dt] = None
    summary: Optional[str] = None
    sentiment: Optional[Sentiment] = None
    topics: Optional[List[str]] = None
    outcome: Optional[str] = None
    source_raw: Optional[str] = None

class InteractionCreate(InteractionBase):
    materials: Optional[List[MaterialSharedCreate]] = []
    samples: Optional[List[SampleCreate]] = []
    follow_ups: Optional[List[FollowUpCreate]] = []

class Interaction(InteractionBase):
    id: str
    created_at: Optional[dt]
    updated_at: Optional[dt]
    materials: List[MaterialShared] = []
    samples: List[Sample] = []
    follow_ups: List[FollowUp] = []

    class Config:
        from_attributes = True
