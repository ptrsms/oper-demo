from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..enums import (
    ApplicationStatus,
    ApplicationStep,
    DocType,
    SimulationStatus,
)
from ..models import Application, Borrower, Document, Expense, Income, Simulation, User
from ..schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationSummary,
    FinancialsStep,
    PersonalStep,
    PropertyStep,
)
from ..schemas.document import DocSlot, DocumentOut
from ..services.doc_requirements import derive_doc_slots
from ..services.refs import generate_ref

router = APIRouter()


async def _load_full(db: AsyncSession, application_id: UUID, user_id: UUID) -> Application:
    stmt = (
        select(Application)
        .where(Application.id == application_id, Application.user_id == user_id)
        .options(
            selectinload(Application.borrowers).selectinload(Borrower.incomes),
            selectinload(Application.expenses),
            selectinload(Application.documents),
        )
    )
    app = await db.scalar(stmt)
    if app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


def _borrower_by_position(app: Application, position: int) -> Borrower:
    for b in app.borrowers:
        if b.position == position:
            return b
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"No borrower at position {position}",
    )


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    sim = await db.get(Simulation, payload.simulation_id)
    if sim is None or sim.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")
    if sim.status == SimulationStatus.CONVERTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Simulation already converted to an application",
        )

    app = Application(
        ref=generate_ref("A"),
        user_id=user.id,
        simulation_id=sim.id,
        status=ApplicationStatus.DRAFT,
        current_step=ApplicationStep.PROPERTY,
        number_of_borrowers=sim.number_of_borrowers,
        property_type=sim.property_type,
        property_region=sim.property_region,
        property_price=sim.property_price,
        property_use=sim.property_use,
        main_residence=sim.main_residence,
        type_of_sale=sim.type_of_sale,
        epc_score=sim.epc_score,
        own_funds=sim.own_funds,
    )
    db.add(app)
    await db.flush()

    for i in range(sim.number_of_borrowers):
        db.add(Borrower(application_id=app.id, position=i + 1))

    sim.status = SimulationStatus.CONVERTED
    await db.commit()

    full = await _load_full(db, app.id, user.id)
    return ApplicationOut.model_validate(full)


@router.get("", response_model=list[ApplicationSummary])
async def list_applications(user: CurrentUser, db: DbSession) -> list[ApplicationSummary]:
    rows = await db.scalars(
        select(Application)
        .where(Application.user_id == user.id)
        .order_by(Application.created_at.desc())
    )
    return [ApplicationSummary.model_validate(a) for a in rows.all()]


@router.get("/{application_id}", response_model=ApplicationOut)
async def get_application(
    application_id: UUID, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    app = await _load_full(db, application_id, user.id)
    return ApplicationOut.model_validate(app)


@router.patch("/{application_id}/property", response_model=ApplicationOut)
async def patch_property(
    application_id: UUID, payload: PropertyStep, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    app = await _load_full(db, application_id, user.id)
    if app.status == ApplicationStatus.SUBMITTED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Application already submitted")

    for field, value in payload.model_dump().items():
        setattr(app, field, value)
    if app.current_step == ApplicationStep.PROPERTY:
        app.current_step = ApplicationStep.FINANCIALS

    await db.commit()
    refreshed = await _load_full(db, app.id, user.id)
    return ApplicationOut.model_validate(refreshed)


@router.patch("/{application_id}/financials", response_model=ApplicationOut)
async def patch_financials(
    application_id: UUID, payload: FinancialsStep, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    app = await _load_full(db, application_id, user.id)
    if app.status == ApplicationStatus.SUBMITTED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Application already submitted")

    for b_in in payload.borrowers:
        b = _borrower_by_position(app, b_in.position)
        b.incomes.clear()
        for inc in b_in.incomes:
            b.incomes.append(
                Income(income_type=inc.income_type, monthly_amount=inc.monthly_amount)
            )

    app.expenses.clear()
    for e in payload.expenses:
        app.expenses.append(
            Expense(
                expense_type=e.expense_type,
                monthly_amount=e.monthly_amount,
                description=e.description,
            )
        )

    if app.current_step in (ApplicationStep.PROPERTY, ApplicationStep.FINANCIALS):
        app.current_step = ApplicationStep.PERSONAL

    await db.commit()
    refreshed = await _load_full(db, app.id, user.id)
    return ApplicationOut.model_validate(refreshed)


@router.patch("/{application_id}/personal", response_model=ApplicationOut)
async def patch_personal(
    application_id: UUID, payload: PersonalStep, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    app = await _load_full(db, application_id, user.id)
    if app.status == ApplicationStatus.SUBMITTED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Application already submitted")

    for b_in in payload.borrowers:
        b = _borrower_by_position(app, b_in.position)
        b.first_name = b_in.first_name
        b.last_name = b_in.last_name
        b.date_of_birth = b_in.date_of_birth
        b.dependents = b_in.dependents

    if app.current_step != ApplicationStep.DONE:
        app.current_step = ApplicationStep.DONE

    await db.commit()
    refreshed = await _load_full(db, app.id, user.id)
    return ApplicationOut.model_validate(refreshed)


@router.post("/{application_id}/submit", response_model=ApplicationOut)
async def submit_application(
    application_id: UUID, user: CurrentUser, db: DbSession
) -> ApplicationOut:
    app = await _load_full(db, application_id, user.id)
    if app.status == ApplicationStatus.SUBMITTED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Application already submitted")
    if app.current_step != ApplicationStep.DONE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Complete all steps before submitting",
        )
    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = datetime.now(timezone.utc)
    await db.commit()
    refreshed = await _load_full(db, app.id, user.id)
    return ApplicationOut.model_validate(refreshed)


@router.get("/{application_id}/documents", response_model=list[DocSlot])
async def list_doc_slots(
    application_id: UUID, user: CurrentUser, db: DbSession
) -> list[DocSlot]:
    app = await _load_full(db, application_id, user.id)
    return derive_doc_slots(app, app.borrowers, app.documents)


@router.post(
    "/{application_id}/documents",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    application_id: UUID,
    user: CurrentUser,
    db: DbSession,
    doc_type: Annotated[DocType, Form()],
    file: Annotated[UploadFile, File()],
    borrower_id: Annotated[UUID | None, Form()] = None,
) -> DocumentOut:
    app = await _load_full(db, application_id, user.id)

    needs_borrower = doc_type in (DocType.PAYSLIP, DocType.PROOF_OF_IDENTITY)
    if needs_borrower:
        if borrower_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{doc_type.value} requires a borrower_id",
            )
        if not any(b.id == borrower_id for b in app.borrowers):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Borrower not found on application"
            )
    else:
        borrower_id = None  # ignore if accidentally provided

    content = await file.read()
    document = Document(
        application_id=app.id,
        borrower_id=borrower_id,
        doc_type=doc_type,
        filename=file.filename or "upload",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        content=content,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return DocumentOut.model_validate(document)
