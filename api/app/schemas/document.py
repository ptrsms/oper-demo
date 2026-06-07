from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from ..enums import DocSlotStatus, DocType


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_id: UUID
    borrower_id: UUID | None
    doc_type: DocType
    filename: str
    mime_type: str
    size_bytes: int
    uploaded_at: datetime


class DocSlot(BaseModel):
    """A required-document slot, derived per application from DocType x borrowers,
    joined with the Document table. status flips to UPLOADED when a Document exists."""

    doc_type: DocType
    label: str
    borrower_id: UUID | None = None
    borrower_name: str | None = None
    address_label: str | None = None
    status: DocSlotStatus
    document: DocumentOut | None = None
