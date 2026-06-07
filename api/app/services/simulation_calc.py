"""Loan simulation math.

Deliberately rough — Belgian-flavoured constants, not a regulated pricing engine.
The point is to return numbers that look plausible on the demo dashboard.
"""
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from ..enums import Region

DEFAULT_INTEREST_RATE = Decimal("0.0430")  # 4.30% nominal annual
REGISTRATION_PCT: dict[Region, Decimal] = {
    Region.FLANDERS: Decimal("0.03"),
    Region.WALLONIA: Decimal("0.125"),
    Region.BRUSSELS: Decimal("0.125"),
}
NOTARY_FEES_PCT = Decimal("0.015")
CREDIT_COSTS_BASE = Decimal("2500.00")
CREDIT_COSTS_PER_10K = Decimal("100.00")
APPLY_VALID_DAYS = 14


def _round(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_simulation(
    *,
    property_price: Decimal,
    region: Region,
    own_funds: Decimal,
    duration_years: int,
    interest_rate: Decimal | None = None,
) -> dict:
    rate = interest_rate or DEFAULT_INTEREST_RATE
    registration_pct = REGISTRATION_PCT.get(region, Decimal("0.125"))
    purchase_costs = _round(property_price * (registration_pct + NOTARY_FEES_PCT))
    loan_amount = max(Decimal("0"), property_price + purchase_costs - own_funds)

    months = duration_years * 12
    monthly_rate = rate / 12
    if monthly_rate == 0 or loan_amount == 0:
        monthly_payment = loan_amount / months if months else Decimal("0")
    else:
        factor = (1 + monthly_rate) ** months
        monthly_payment = loan_amount * (monthly_rate * factor) / (factor - 1)

    credit_costs = _round(CREDIT_COSTS_BASE + (loan_amount / Decimal("10000")) * CREDIT_COSTS_PER_10K)
    total_project_cost = _round(property_price + purchase_costs + credit_costs)

    return {
        "interest_rate": rate,
        "loan_amount": _round(loan_amount),
        "monthly_payment": _round(monthly_payment),
        "purchase_costs": purchase_costs,
        "credit_costs": credit_costs,
        "total_project_cost": total_project_cost,
        "apply_until": date.today() + timedelta(days=APPLY_VALID_DAYS),
    }
