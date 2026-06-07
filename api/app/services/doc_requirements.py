"""Derive the per-application required-documents list.

There's no DocumentRequirement table — the list is computed from the DocType enum
plus the number of borrowers, then joined with what's been uploaded. Keeps the
schema small at the cost of one bit of business logic living in code.
"""
from collections.abc import Iterable

from ..enums import DocSlotStatus, DocType
from ..models import Application, Borrower, Document
from ..schemas.document import DocSlot, DocumentOut


def _format_address(app: Application) -> str | None:
    parts = [p for p in [app.street, app.house_number, app.postal_code, app.city] if p]
    return ", ".join(parts) if parts else None


def _borrower_label(b: Borrower) -> str:
    name = f"{(b.first_name or '').strip()} {(b.last_name or '').strip()}".strip()
    return name or f"Borrower {b.position}"


def derive_doc_slots(
    application: Application,
    borrowers: Iterable[Borrower],
    documents: Iterable[Document],
) -> list[DocSlot]:
    doc_by_key: dict[tuple[DocType, str | None], Document] = {}
    for d in documents:
        key = (d.doc_type, str(d.borrower_id) if d.borrower_id else None)
        doc_by_key[key] = d

    slots: list[DocSlot] = []
    address = _format_address(application)

    for doc_type, label in [
        (DocType.EPC_CERTIFICATE, "EPC Certificate"),
        (DocType.PURCHASE_AGREEMENT, "Purchase Agreement"),
    ]:
        d = doc_by_key.get((doc_type, None))
        slots.append(
            DocSlot(
                doc_type=doc_type,
                label=label,
                address_label=address if doc_type is DocType.EPC_CERTIFICATE else None,
                status=DocSlotStatus.UPLOADED if d else DocSlotStatus.REQUESTED,
                document=DocumentOut.model_validate(d) if d else None,
            )
        )

    for b in borrowers:
        for doc_type, label in [
            (DocType.PROOF_OF_IDENTITY, "Proof of identity"),
            (DocType.PAYSLIP, "Payslip"),
        ]:
            d = doc_by_key.get((doc_type, str(b.id)))
            slots.append(
                DocSlot(
                    doc_type=doc_type,
                    label=label,
                    borrower_id=b.id,
                    borrower_name=_borrower_label(b),
                    status=DocSlotStatus.UPLOADED if d else DocSlotStatus.REQUESTED,
                    document=DocumentOut.model_validate(d) if d else None,
                )
            )

    return slots
