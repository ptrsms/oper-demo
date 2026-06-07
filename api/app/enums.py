from enum import Enum


class ProjectPurpose(str, Enum):
    PURCHASE = "PURCHASE"
    BUILD = "BUILD"
    BUYOUT = "BUYOUT"
    RENOVATE = "RENOVATE"
    REFINANCE = "REFINANCE"


class SimulationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CONVERTED = "CONVERTED"
    EXPIRED = "EXPIRED"


class PropertyType(str, Enum):
    HOUSE = "HOUSE"
    APARTMENT = "APARTMENT"
    LAND = "LAND"


class Region(str, Enum):
    FLANDERS = "FLANDERS"
    WALLONIA = "WALLONIA"
    BRUSSELS = "BRUSSELS"


class PropertyUse(str, Enum):
    LIVING = "LIVING"
    RENTAL = "RENTAL"


class SaleType(str, Enum):
    PRIVATE = "PRIVATE"
    PUBLIC = "PUBLIC"
    NEW_BUILD = "NEW_BUILD"


class ProductType(str, Enum):
    FIXED = "FIXED"
    VARIABLE = "VARIABLE"
    MIXED = "MIXED"


class IncomeType(str, Enum):
    SALARY = "SALARY"
    SELF_EMPLOYED = "SELF_EMPLOYED"
    CHILD_BENEFIT = "CHILD_BENEFIT"
    MEAL_VOUCHERS = "MEAL_VOUCHERS"
    COMPANY_CAR = "COMPANY_CAR"
    HEALTH_INSURANCE = "HEALTH_INSURANCE"
    RENTAL = "RENTAL"
    OTHER = "OTHER"


class ExpenseType(str, Enum):
    RENT = "RENT"
    EXISTING_LOAN = "EXISTING_LOAN"
    ALIMONY = "ALIMONY"
    OTHER = "OTHER"


class DocType(str, Enum):
    EPC_CERTIFICATE = "EPC_CERTIFICATE"
    PROOF_OF_IDENTITY = "PROOF_OF_IDENTITY"
    PAYSLIP = "PAYSLIP"
    PURCHASE_AGREEMENT = "PURCHASE_AGREEMENT"


class ApplicationStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"


class ApplicationStep(str, Enum):
    PROPERTY = "PROPERTY"
    FINANCIALS = "FINANCIALS"
    PERSONAL = "PERSONAL"
    DONE = "DONE"


class DocSlotStatus(str, Enum):
    REQUESTED = "REQUESTED"
    UPLOADED = "UPLOADED"
