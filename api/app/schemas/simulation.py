from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from ..enums import (
    ProductType,
    ProjectPurpose,
    PropertyType,
    PropertyUse,
    Region,
    SaleType,
    SimulationStatus,
)


class SimulationCreate(BaseModel):
    project_purpose: ProjectPurpose = ProjectPurpose.PURCHASE
    number_of_borrowers: int = Field(default=1, ge=1, le=2)
    property_type: PropertyType
    property_region: Region
    property_price: Decimal = Field(gt=0)
    property_use: PropertyUse = PropertyUse.LIVING
    main_residence: bool = True
    type_of_sale: SaleType = SaleType.PRIVATE
    epc_score: int | None = Field(default=None, ge=0, le=1000)
    own_funds: Decimal = Field(ge=0)
    duration_years: int = Field(ge=5, le=30)


class SimulationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ref: str
    user_id: UUID | None
    status: SimulationStatus
    project_purpose: ProjectPurpose
    number_of_borrowers: int

    property_type: PropertyType
    property_region: Region
    property_price: Decimal
    property_use: PropertyUse
    main_residence: bool
    type_of_sale: SaleType
    epc_score: int | None

    own_funds: Decimal
    duration_years: int
    interest_rate: Decimal
    loan_amount: Decimal
    monthly_payment: Decimal
    purchase_costs: Decimal
    credit_costs: Decimal
    total_project_cost: Decimal
    product_type: ProductType
    apply_until: date
    created_at: datetime


class SimulationCreateResponse(BaseModel):
    simulation: SimulationOut
    claim_token: str | None = None
