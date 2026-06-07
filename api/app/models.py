from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base
from .enums import (
    ApplicationStatus,
    ApplicationStep,
    DocType,
    ExpenseType,
    IncomeType,
    ProductType,
    ProjectPurpose,
    PropertyType,
    PropertyUse,
    Region,
    SaleType,
    SimulationStatus,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    ref: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    claim_token: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    status: Mapped[SimulationStatus] = mapped_column(
        SAEnum(SimulationStatus, name="simulation_status"), default=SimulationStatus.ACTIVE, nullable=False
    )
    project_purpose: Mapped[ProjectPurpose] = mapped_column(
        SAEnum(ProjectPurpose, name="project_purpose"), nullable=False
    )
    number_of_borrowers: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    property_type: Mapped[PropertyType] = mapped_column(SAEnum(PropertyType, name="property_type"), nullable=False)
    property_region: Mapped[Region] = mapped_column(SAEnum(Region, name="region"), nullable=False)
    property_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    property_use: Mapped[PropertyUse] = mapped_column(SAEnum(PropertyUse, name="property_use"), nullable=False)
    main_residence: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    type_of_sale: Mapped[SaleType] = mapped_column(SAEnum(SaleType, name="sale_type"), nullable=False)
    epc_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    own_funds: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    duration_years: Mapped[int] = mapped_column(Integer, nullable=False)
    interest_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4), nullable=False)
    loan_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    monthly_payment: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    purchase_costs: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    credit_costs: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_project_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    product_type: Mapped[ProductType] = mapped_column(
        SAEnum(ProductType, name="product_type"), default=ProductType.FIXED, nullable=False
    )

    apply_until: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    ref: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    simulation_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("simulations.id"), nullable=True
    )

    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="application_status"), default=ApplicationStatus.DRAFT, nullable=False
    )
    current_step: Mapped[ApplicationStep] = mapped_column(
        SAEnum(ApplicationStep, name="application_step"), default=ApplicationStep.PROPERTY, nullable=False
    )
    number_of_borrowers: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    property_type: Mapped[PropertyType] = mapped_column(SAEnum(PropertyType, name="property_type"), nullable=False)
    property_region: Mapped[Region] = mapped_column(SAEnum(Region, name="region"), nullable=False)
    property_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    property_use: Mapped[PropertyUse] = mapped_column(SAEnum(PropertyUse, name="property_use"), nullable=False)
    main_residence: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    type_of_sale: Mapped[SaleType] = mapped_column(SAEnum(SaleType, name="sale_type"), nullable=False)
    epc_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    street: Mapped[str | None] = mapped_column(String(255), nullable=True)
    house_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    box: Mapped[str | None] = mapped_column(String(20), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(12), nullable=True)

    own_funds: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    borrowers: Mapped[list["Borrower"]] = relationship(
        "Borrower", back_populates="application", cascade="all, delete-orphan", order_by="Borrower.position"
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense", back_populates="application", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="application", cascade="all, delete-orphan"
    )


class Borrower(Base):
    __tablename__ = "borrowers"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    first_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    dependents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    application: Mapped[Application] = relationship("Application", back_populates="borrowers")
    incomes: Mapped[list["Income"]] = relationship(
        "Income", back_populates="borrower", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="borrower")


class Income(Base):
    __tablename__ = "incomes"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    borrower_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("borrowers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    income_type: Mapped[IncomeType] = mapped_column(SAEnum(IncomeType, name="income_type"), nullable=False)
    monthly_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    borrower: Mapped[Borrower] = relationship("Borrower", back_populates="incomes")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expense_type: Mapped[ExpenseType] = mapped_column(SAEnum(ExpenseType, name="expense_type"), nullable=False)
    monthly_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    application: Mapped[Application] = relationship("Application", back_populates="expenses")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    borrower_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("borrowers.id"), nullable=True
    )
    doc_type: Mapped[DocType] = mapped_column(SAEnum(DocType, name="doc_type"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    application: Mapped[Application] = relationship("Application", back_populates="documents")
    borrower: Mapped[Borrower | None] = relationship("Borrower", back_populates="documents")
