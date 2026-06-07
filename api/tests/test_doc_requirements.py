from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import uuid4

from app.enums import (
    ApplicationStatus,
    ApplicationStep,
    DocSlotStatus,
    DocType,
    PropertyType,
    PropertyUse,
    Region,
    SaleType,
)
from app.models import Application, Borrower, Document
from app.services.doc_requirements import derive_doc_slots


def _make_app(borrowers: int = 1, with_address: bool = True) -> tuple[Application, list[Borrower]]:
    app = Application(
        id=uuid4(),
        ref="A0001",
        user_id=uuid4(),
        simulation_id=None,
        status=ApplicationStatus.DRAFT,
        current_step=ApplicationStep.PROPERTY,
        number_of_borrowers=borrowers,
        property_type=PropertyType.HOUSE,
        property_region=Region.FLANDERS,
        property_price=Decimal("300000"),
        property_use=PropertyUse.LIVING,
        main_residence=True,
        type_of_sale=SaleType.PRIVATE,
        epc_score=120,
        street="Ankerrui" if with_address else None,
        house_number="1" if with_address else None,
        box=None,
        city="Antwerpen" if with_address else None,
        postal_code="2000" if with_address else None,
        own_funds=Decimal("70000"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        submitted_at=None,
    )
    bs = [
        Borrower(
            id=uuid4(),
            application_id=app.id,
            position=i + 1,
            first_name=f"First{i}",
            last_name="Last",
            date_of_birth=date(1990, 1, 1),
            dependents=0,
        )
        for i in range(borrowers)
    ]
    return app, bs


def test_single_borrower_produces_four_slots_all_requested():
    app, borrowers = _make_app(borrowers=1)
    slots = derive_doc_slots(app, borrowers, [])
    assert len(slots) == 4
    assert [s.doc_type for s in slots] == [
        DocType.EPC_CERTIFICATE,
        DocType.PURCHASE_AGREEMENT,
        DocType.PROOF_OF_IDENTITY,
        DocType.PAYSLIP,
    ]
    assert all(s.status == DocSlotStatus.REQUESTED for s in slots)
    # EPC carries the property address
    epc = slots[0]
    assert "Ankerrui" in (epc.address_label or "")
    assert "Antwerpen" in (epc.address_label or "")


def test_two_borrowers_produce_six_slots():
    app, borrowers = _make_app(borrowers=2)
    slots = derive_doc_slots(app, borrowers, [])
    assert len(slots) == 6


def test_uploaded_document_flips_slot_status():
    app, borrowers = _make_app(borrowers=1)
    borrower = borrowers[0]
    payslip = Document(
        id=uuid4(),
        application_id=app.id,
        borrower_id=borrower.id,
        doc_type=DocType.PAYSLIP,
        filename="ps.pdf",
        mime_type="application/pdf",
        size_bytes=10,
        content=b"x",
        uploaded_at=datetime.now(timezone.utc),
    )
    slots = derive_doc_slots(app, borrowers, [payslip])
    payslip_slot = next(s for s in slots if s.doc_type == DocType.PAYSLIP and s.borrower_id == borrower.id)
    assert payslip_slot.status == DocSlotStatus.UPLOADED
    assert payslip_slot.document is not None
    assert payslip_slot.document.filename == "ps.pdf"
