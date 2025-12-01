from sqlalchemy import Column, String, Integer, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import datetime as _dt
from .db import Base
import enum

class SentimentEnum(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

def gen_uuid():
    return str(uuid.uuid4())

class HCP(Base):
    __tablename__ = "hcps"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False, index=True)
    title = Column(String, nullable=True)
    speciality = Column(String, nullable=True)
    organisation = Column(String, nullable=True)
    contact = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=_dt.datetime.utcnow)
    updated_at = Column(DateTime, default=_dt.datetime.utcnow, onupdate=_dt.datetime.utcnow)

    interactions = relationship("Interaction", back_populates="hcp")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    hcp_id = Column(UUID(as_uuid=False), ForeignKey("hcps.id"), nullable=True, index=True)
    rep_id = Column(String, nullable=True)  # link to user id (string/uuid)
    mode = Column(String, nullable=False, default="conversational")  # structured|conversational
    datetime = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=True)
    sentiment = Column(Enum(SentimentEnum), nullable=True)
    topics = Column(JSON, nullable=True)
    outcome = Column(Text, nullable=True)
    source_raw = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_dt.datetime.utcnow)
    updated_at = Column(DateTime, default=_dt.datetime.utcnow, onupdate=_dt.datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")
    materials = relationship("MaterialShared", back_populates="interaction", cascade="all, delete-orphan")
    samples = relationship("Sample", back_populates="interaction", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="interaction", cascade="all, delete-orphan")


class MaterialShared(Base):
    __tablename__ = "materials_shared"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    interaction_id = Column(UUID(as_uuid=False), ForeignKey("interactions.id"), nullable=False)
    material_type = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    interaction = relationship("Interaction", back_populates="materials")


class Sample(Base):
    __tablename__ = "samples"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    interaction_id = Column(UUID(as_uuid=False), ForeignKey("interactions.id"), nullable=False)
    product_code = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    lot = Column(String, nullable=True)

    interaction = relationship("Interaction", back_populates="samples")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    interaction_id = Column(UUID(as_uuid=False), ForeignKey("interactions.id"), nullable=False)
    due_date = Column(DateTime, nullable=True)
    action_item = Column(Text, nullable=False)
    owner = Column(String, nullable=True)
    status = Column(String, default="open")

    interaction = relationship("Interaction", back_populates="follow_ups")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    actor = Column(String, nullable=True)
    timestamp = Column(DateTime, default=_dt.datetime.utcnow)
    diff = Column(JSON, nullable=True)
