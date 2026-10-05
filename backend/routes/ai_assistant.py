import os
import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.vehicle import Vehicle
from backend.routes.auth import get_current_user
from backend.schemas.ai_assistant import (
    AIProblemRequest,
    AIProblemResponse,
)


# =========================================================
# ENVIRONMENT
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"

load_dotenv(
    ENV_FILE,
    override=True
)

OPENAI_API_KEY = os.getenv(
    "OPENAI_API_KEY"
)

OPENAI_MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-4.1-mini"
)


# =========================================================
# OPENAI CLIENT
# =========================================================

client = None

if OPENAI_API_KEY:

    try:

        client = OpenAI(
            api_key=OPENAI_API_KEY
        )

    except Exception as e:

        print(
            "OpenAI client initialization failed:",
            str(e)
        )

        client = None


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/ai-assistant",
    tags=["AI Assistant"]
)


# =========================================================
# DEMO AI RESPONSE
# =========================================================

def generate_demo_response(
    problem: str,
    vehicle: Vehicle
):

    problem_text = (
        problem
        .lower()
        .strip()
    )


    possible_causes = []
    recommended_actions = []
    urgency = "Normal"


    # -----------------------------------------------------
    # ENGINE / STARTING
    # -----------------------------------------------------

    if any(
        word in problem_text
        for word in [
            "engine",
            "start",
            "starting",
            "stalled",
            "stall",
            "misfire",
            "jerking"
        ]
    ):

        possible_causes = [
            "Battery voltage or starting-system issue",
            "Fuel delivery or ignition-system problem",
            "Engine sensor or electrical-system fault"
        ]

        recommended_actions = [
            "Check battery condition and warning lights",
            "Avoid repeated starting attempts if the engine is not responding normally",
            "Have the vehicle inspected by a qualified mechanic"
        ]

        urgency = "Medium"


    # -----------------------------------------------------
    # BRAKE
    # -----------------------------------------------------

    elif any(
        word in problem_text
        for word in [
            "brake",
            "braking",
            "brakes",
            "brake noise",
            "brake sound"
        ]
    ):

        possible_causes = [
            "Brake pad wear",
            "Brake disc or drum surface wear",
            "Brake fluid or brake-system issue"
        ]

        recommended_actions = [
            "Do not ignore unusual brake noise or reduced braking performance",
            "Check brake pads and brake fluid as soon as possible",
            "If braking performance is significantly reduced, avoid driving and seek professional assistance"
        ]

        urgency = "High"


    # -----------------------------------------------------
    # BATTERY
    # -----------------------------------------------------

    elif any(
        word in problem_text
        for word in [
            "battery",
            "battery low",
            "battery dead",
            "not charging",
            "charging"
        ]
    ):

        possible_causes = [
            "Weak or ageing battery",
            "Alternator or charging-system issue",
            "Loose or corroded battery connection"
        ]

        recommended_actions = [
            "Check battery terminals for corrosion or loose connections",
            "Check battery voltage and charging-system output",
            "Have the battery and alternator tested if the problem continues"
        ]

        urgency = "Medium"


    # -----------------------------------------------------
    # TYRE
    # -----------------------------------------------------

    elif any(
        word in problem_text
        for word in [
            "tyre",
            "tire",
            "puncture",
            "wheel",
            "steering",
            "vibration"
        ]
    ):

        possible_causes = [
            "Incorrect tyre pressure",
            "Tyre wear or wheel imbalance",
            "Wheel alignment or suspension issue"
        ]

        recommended_actions = [
            "Check tyre pressure and visible tyre damage",
            "Avoid high-speed driving if strong vibration is present",
            "Get wheel alignment, balancing and tyre condition checked"
        ]

        urgency = "Medium"


    # -----------------------------------------------------
    # OVERHEATING
    # -----------------------------------------------------

    elif any(
        word in problem_text
        for word in [
            "overheat",
            "overheating",
            "temperature",
            "hot engine",
            "coolant"
        ]
    ):

        possible_causes = [
            "Low coolant level or coolant leak",
            "Cooling fan or thermostat issue",
            "Radiator or cooling-system problem"
        ]

        recommended_actions = [
            "Stop the vehicle safely if the temperature warning is active",
            "Do not open the coolant reservoir while the engine is hot",
            "Have the cooling system inspected before continued driving"
        ]

        urgency = "Critical"


    # -----------------------------------------------------
    # AC
    # -----------------------------------------------------

    elif any(
        word in problem_text
        for word in [
            "ac",
            "air conditioner",
            "air conditioning",
            "cooling"
        ]
    ):

        possible_causes = [
            "Low refrigerant level",
            "AC compressor or electrical issue",
            "Cabin filter or airflow restriction"
        ]

        recommended_actions = [
            "Check whether the AC fan and compressor are operating normally",
            "Inspect the cabin air filter if airflow is weak",
            "Have the AC system checked for refrigerant leaks if cooling remains poor"
        ]

        urgency = "Normal"


    # -----------------------------------------------------
    # OIL
    # -----------------------------------------------------

    elif any(
        word in problem_text
        for word in [
            "oil",
            "engine oil",
            "lubrication"
        ]
    ):

        possible_causes = [
            "Low engine oil level",
            "Old or degraded engine oil",
            "Possible oil leak"
        ]

        recommended_actions = [
            "Check the engine oil level using the correct procedure",
            "Inspect for visible oil leakage",
            "Follow the manufacturer's recommended oil-change interval"
        ]

        urgency = "Medium"


    # -----------------------------------------------------
    # GENERAL
    # -----------------------------------------------------

    else:

        possible_causes = [
            "Electrical or sensor-related issue",
            "Normal component wear or maintenance-related issue",
            "A vehicle-specific mechanical or fluid-system problem"
        ]

        recommended_actions = [
            "Check the dashboard for warning lights or messages",
            "Note when and under what conditions the problem occurs",
            "Have the vehicle inspected by a qualified mechanic if the issue continues"
        ]

        urgency = "Normal"


    return {
        "possible_causes": possible_causes,
        "recommended_actions": recommended_actions,
        "urgency": urgency
    }


# =========================================================
# ANALYZE VEHICLE PROBLEM
# =========================================================

@router.post(
    "/analyze",
    response_model=AIProblemResponse
)
def analyze_vehicle_problem(
    data: AIProblemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # =====================================================
    # FIND VEHICLE
    # =====================================================

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == data.vehicle_id,
            Vehicle.user_id == current_user.id
        )
        .first()
    )


    if not vehicle:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )


    # =====================================================
    # VEHICLE INFORMATION
    # =====================================================

    vehicle_info = f"""
Vehicle Information:

- Type: {vehicle.vehicle_type}
- Brand: {vehicle.brand}
- Model: {vehicle.model}
- Year: {vehicle.year}
- Fuel Type: {vehicle.fuel_type}
- Current Mileage: {vehicle.current_mileage} km
- Last Service KM: {vehicle.last_service_km}
- Last Service Date: {vehicle.last_service_date}
"""


    # =====================================================
    # SYSTEM PROMPT
    # =====================================================

    system_prompt = """
You are an AI vehicle service assistant.

Analyze the user's reported vehicle problem and provide
practical, safety-conscious automotive guidance.

IMPORTANT RULES:

- Do not provide a final mechanical diagnosis.
- Provide possible causes only.
- Do not claim certainty.
- Give practical recommended actions.
- If the problem could be dangerous, set urgency to High
  or Critical.
- Keep the explanation understandable for a normal vehicle owner.
- Never encourage unsafe vehicle operation.

Return ONLY valid JSON.

Use exactly this structure:

{
  "possible_causes": [
    "cause 1",
    "cause 2",
    "cause 3"
  ],
  "recommended_actions": [
    "action 1",
    "action 2",
    "action 3"
  ],
  "urgency": "Normal"
}

Urgency must be exactly one of:

Normal
Medium
High
Critical
"""


    # =====================================================
    # USER PROMPT
    # =====================================================

    user_prompt = f"""
{vehicle_info}

Reported Problem:

{data.problem}
"""


    # =====================================================
    # TRY REAL OPENAI
    # =====================================================

    if client:

        try:

            response = client.chat.completions.create(

                model=OPENAI_MODEL,

                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],

                temperature=0.2
            )


            ai_text = (
                response
                .choices[0]
                .message
                .content
            )


            if ai_text:

                ai_result = json.loads(
                    ai_text
                )


                possible_causes = (
                    ai_result.get(
                        "possible_causes",
                        []
                    )
                )


                recommended_actions = (
                    ai_result.get(
                        "recommended_actions",
                        []
                    )
                )


                urgency = (
                    ai_result.get(
                        "urgency",
                        "Normal"
                    )
                )


                if urgency not in [
                    "Normal",
                    "Medium",
                    "High",
                    "Critical"
                ]:

                    urgency = "Normal"


                if (
                    possible_causes
                    and recommended_actions
                ):

                    print(
                        "AI Assistant Mode: OPENAI"
                    )


                    return AIProblemResponse(

                        vehicle_id=vehicle.id,

                        problem=data.problem,

                        possible_causes=possible_causes,

                        recommended_actions=recommended_actions,

                        urgency=urgency,

                        disclaimer=(
                            "This AI response provides "
                            "possible causes and general "
                            "guidance only. It is not a "
                            "final mechanical diagnosis."
                        )
                    )


        except Exception as e:

            print(
                "OpenAI unavailable. "
                "Switching to demo AI mode."
            )

            print(
                "OpenAI Error:",
                str(e)
            )


    # =====================================================
    # DEMO FALLBACK
    # =====================================================

    print(
        "AI Assistant Mode: DEMO FALLBACK"
    )


    demo_result = generate_demo_response(
        data.problem,
        vehicle
    )


    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return AIProblemResponse(

        vehicle_id=vehicle.id,

        problem=data.problem,

        possible_causes=(
            demo_result[
                "possible_causes"
            ]
        ),

        recommended_actions=(
            demo_result[
                "recommended_actions"
            ]
        ),

        urgency=(
            demo_result[
                "urgency"
            ]
        ),

        disclaimer=(
            "This AI response provides "
            "possible causes and general "
            "guidance only. It is not a "
            "final mechanical diagnosis."
        )
    )