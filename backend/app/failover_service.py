"""Failure simulation for provider failover testing.

Parses the X-Simulate-Failure header and determines whether a given key
should be treated as failed for the current request only.
"""

from typing import Dict, Optional

from app.config import ENABLE_FAILURE_SIMULATION

SIMULATED_FAILURE_CODES = {"429", "500", "502", "503"}


def parse_simulation_header(header_value: Optional[str]) -> Dict[str, str]:
    """Parse X-Simulate-Failure into {key_id: status_code} or {'*': status_code}.

    Examples:
        "key_1=429" -> {"key_1": "429"}
        "key_1=429,key_2=500" -> {"key_1": "429", "key_2": "500"}
        "*=429" -> {"*": "429"}
    """
    simulation: Dict[str, str] = {}
    if not ENABLE_FAILURE_SIMULATION or not header_value:
        return simulation
    for entry in header_value.split(","):
        entry = entry.strip()
        if not entry or "=" not in entry:
            continue
        key, code = entry.split("=", 1)
        key = key.strip()
        code = code.strip()
        if key and code:
            simulation[key] = code
    return simulation


def is_key_simulated_failure(key_id: str, simulation: Dict[str, str]) -> bool:
    """Return True if the given key should fail for this request."""
    code = simulation.get(key_id) or simulation.get("*")
    if not code:
        return False
    return code in SIMULATED_FAILURE_CODES


def simulated_status_code(key_id: str, simulation: Dict[str, str]) -> Optional[int]:
    """Return the simulated HTTP status code for a key, or None."""
    code = simulation.get(key_id) or simulation.get("*")
    if not code or code not in SIMULATED_FAILURE_CODES:
        return None
    return int(code)
