from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Application, Document
from ..schemas.document import DocumentOut

router = APIRouter()


async def _get_owned_document(db, document_id: UUID, user_id: UUID) -> Document:
    stmt = (
        select(Document)
        .where(Document.id == document_id)
        .options(selectinload(Document.application))
    )
    doc = await db.scalar(stmt)
    if doc is None or doc.application is None or doc.application.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(document_id: UUID, user: CurrentUser, db: DbSession) -> DocumentOut:
    doc = await _get_owned_document(db, document_id, user.id)
    return DocumentOut.model_validate(doc)


@router.get("/{document_id}/content")
async def download_document(
    document_id: UUID, user: CurrentUser, db: DbSession
) -> Response:
    doc = await _get_owned_document(db, document_id, user.id)
    return Response(
        content=doc.content,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )
