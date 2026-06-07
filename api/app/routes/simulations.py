from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from ..deps import CurrentUser, DbSession, OptionalUser
from ..models import Simulation
from ..schemas.simulation import (
    SimulationCreate,
    SimulationCreateResponse,
    SimulationOut,
)
from ..services.refs import generate_claim_token, generate_ref
from ..services.simulation_calc import compute_simulation

router = APIRouter()


@router.post(
    "",
    response_model=SimulationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_simulation(
    payload: SimulationCreate,
    db: DbSession,
    user: OptionalUser,
) -> SimulationCreateResponse:
    calc = compute_simulation(
        property_price=payload.property_price,
        region=payload.property_region,
        own_funds=payload.own_funds,
        duration_years=payload.duration_years,
    )
    claim_token = None if user else generate_claim_token()
    sim = Simulation(
        ref=generate_ref("S"),
        user_id=user.id if user else None,
        claim_token=claim_token,
        project_purpose=payload.project_purpose,
        number_of_borrowers=payload.number_of_borrowers,
        property_type=payload.property_type,
        property_region=payload.property_region,
        property_price=payload.property_price,
        property_use=payload.property_use,
        main_residence=payload.main_residence,
        type_of_sale=payload.type_of_sale,
        epc_score=payload.epc_score,
        own_funds=payload.own_funds,
        duration_years=payload.duration_years,
        **calc,
    )
    db.add(sim)
    await db.commit()
    await db.refresh(sim)
    return SimulationCreateResponse(
        simulation=SimulationOut.model_validate(sim),
        claim_token=claim_token,
    )


@router.get("", response_model=list[SimulationOut])
async def list_simulations(user: CurrentUser, db: DbSession) -> list[SimulationOut]:
    rows = await db.scalars(
        select(Simulation)
        .where(Simulation.user_id == user.id)
        .order_by(Simulation.created_at.desc())
    )
    return [SimulationOut.model_validate(s) for s in rows.all()]


@router.get("/{simulation_id}", response_model=SimulationOut)
async def get_simulation(
    simulation_id: UUID,
    db: DbSession,
    user: OptionalUser,
    claim_token: str | None = Query(default=None),
) -> SimulationOut:
    sim = await db.get(Simulation, simulation_id)
    if sim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")
    # Owner sees their own; anonymous read requires the matching claim_token.
    if sim.user_id is not None:
        if user is None or sim.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    else:
        if claim_token is None or claim_token != sim.claim_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="claim_token required")
    return SimulationOut.model_validate(sim)
