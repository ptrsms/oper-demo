from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from ..enums import (
    ApplicationStatus,
    ApplicationStep,
    ExpenseType,
    IncomeType,
    PropertyType,
    PropertyUse,
    Region,
    SaleType,
)


class ApplicationCreate(BaseModel):
    simulation_id: UUID


class PropertyStep(BaseModel):
    property_type: PropertyType
    property_region: Region
    property_price: Decimal = Field(gt=0)
    property_use: PropertyUse
    main_residence: bool = True
    type_of_sale: SaleType
    epc_score: int | None = Field(default=None, ge=0, le=1000)
    street: str = Field(min_length=1, max_length=255)
    house_number: str = Field(min_length=1, max_length=20)
    box: str | None = Field(default=None, max_length=20)
    city: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=1, max_length=12)
    own_funds: Decimal = Field(ge=0)


class IncomeIn(BaseModel):
    income_type: IncomeType
    monthly_amount: Decimal = Field(ge=0)


class ExpenseIn(BaseModel):
    expense_type: ExpenseType
    monthly_amount: Decimal = Field(ge=0)
    description: str | None = None


class BorrowerFinancialsIn(BaseModel):
    position: int = Field(ge=1, le=2)
    incomes: list[IncomeIn] = Field(min_length=1)


class FinancialsStep(BaseModel):
    borrowers: list[BorrowerFinancialsIn] = Field(min_length=1)
    expenses: list[ExpenseIn] = []


class BorrowerPersonalIn(BaseModel):
    position: int = Field(ge=1, le=2)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    date_of_birth: date
    dependents: int = Field(ge=0)


class PersonalStep(BaseModel):
    borrowers: list[BorrowerPersonalIn] = Field(min_length=1)


class IncomeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    income_type: IncomeType
    monthly_amount: Decimal


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    expense_type: ExpenseType
    monthly_amount: Decimal
    description: str | None = None


class BorrowerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    position: int
    first_name: str | None
    last_name: str | None
    date_of_birth: date | None
    dependents: int
    incomes: list[IncomeOut] = []


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ref: str
    user_id: UUID
    simulation_id: UUID | None
    status: ApplicationStatus
    current_step: ApplicationStep
    number_of_borrowers: int

    property_type: PropertyType
    property_region: Region
    property_price: Decimal
    property_use: PropertyUse
    main_residence: bool
    type_of_sale: SaleType
    epc_score: int | None

    street: str | None
    house_number: str | None
    box: str | None
    city: str | None
    postal_code: str | None

    own_funds: Decimal

    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None

    borrowers: list[BorrowerOut] = []
    expenses: list[ExpenseOut] = []


class ApplicationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ref: str
    status: ApplicationStatus
    current_step: ApplicationStep
    property_price: Decimal
    submitted_at: datetime | None
    created_at: datetime
