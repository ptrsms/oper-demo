from datetime import date, timedelta
from decimal import Decimal

from app.enums import Region
from app.services.simulation_calc import compute_simulation


def test_basic_purchase_in_flanders():
    r = compute_simulation(
        property_price=Decimal("300000"),
        region=Region.FLANDERS,
        own_funds=Decimal("70000"),
        duration_years=20,
    )
    # registration 3% + notary 1.5% = 4.5% of 300k = 13,500
    assert r["purchase_costs"] == Decimal("13500.00")
    # 300000 + 13500 - 70000
    assert r["loan_amount"] == Decimal("243500.00")
    # ballpark check on the annuity at 4.30% over 240 months
    assert Decimal("1450") < r["monthly_payment"] < Decimal("1600")
    assert r["interest_rate"] == Decimal("0.0430")
    assert r["apply_until"] == date.today() + timedelta(days=14)


def test_no_loan_when_funds_cover_costs():
    r = compute_simulation(
        property_price=Decimal("100000"),
        region=Region.FLANDERS,
        own_funds=Decimal("200000"),
        duration_years=20,
    )
    assert r["loan_amount"] == Decimal("0.00")
    assert r["monthly_payment"] == Decimal("0.00")


def test_wallonia_has_higher_registration_costs():
    flanders = compute_simulation(
        property_price=Decimal("300000"),
        region=Region.FLANDERS,
        own_funds=Decimal("0"),
        duration_years=25,
    )
    wallonia = compute_simulation(
        property_price=Decimal("300000"),
        region=Region.WALLONIA,
        own_funds=Decimal("0"),
        duration_years=25,
    )
    assert wallonia["purchase_costs"] > flanders["purchase_costs"]
    assert wallonia["loan_amount"] > flanders["loan_amount"]
