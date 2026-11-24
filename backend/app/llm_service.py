import time
from typing import List, Dict, Any, Optional, Tuple

import httpx
import litellm
from litellm import completion

from app.config import (
    LLM_API_KEYS,
    KEY_IDS,
    DEFAULT_MODEL,
    CACHE_ENABLED,
    LITELLM_CACHE_TYPE,
    LITELLM_CACHE_TTL,
    DEFAULT_TIMEOUT,
)

# Patch LiteLLM's internal default HTTP client timeout (which defaults to only 5.0 seconds)
try:
    import litellm.llms.custom_httpx.http_handler as _litellm_http_handler
    _litellm_http_handler._DEFAULT_TIMEOUT = httpx.Timeout(float(DEFAULT_TIMEOUT))
except Exception:
    pass
from app.cache_service import configure_cache
from app.failover_service import (
    parse_simulation_header,
    is_key_simulated_failure,
    simulated_status_code,
)


def _messages_to_list(system_prompt: Optional[str], history: List[Dict[str, str]], user_message: str) -> List[Dict[str, str]]:
    messages: List[Dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages


def _get_usage_field(usage: Any, *names: str) -> int:
    for name in names:
        if usage is None:
            continue
        if hasattr(usage, name):
            val = getattr(usage, name)
            if val is not None:
                return int(val)
        if isinstance(usage, dict) and usage.get(name) is not None:
            return int(usage.get(name))
    return 0


class LLMService:
    def __init__(self):
        self.default_model = DEFAULT_MODEL
        self.keys = list(LLM_API_KEYS)
        self.key_ids = list(KEY_IDS)
        configure_cache()

    def _call_single_key(
        self,
        key: str,
        key_id: str,
        messages: List[Dict[str, str]],
        simulation: Dict[str, str],
        model: Optional[str] = None,
    ) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]], Optional[int]]:
        """Attempt inference with a single key.
        Returns (success, reply, metadata, status_code_if_failed).
        """
        if is_key_simulated_failure(key_id, simulation):
            return False, None, None, simulated_status_code(key_id, simulation) or 500

        target_model = model or self.default_model
        start = time.perf_counter()
        try:
            response = completion(
                model=target_model,
                messages=messages,
                api_key=key,
                timeout=25,
                caching=CACHE_ENABLED,
                num_retries=0,
            )
        except Exception as exc:
            import traceback
            print(f"[LLM ERROR] Key {key_id} failed: {type(exc).__name__}: {exc}", flush=True)
            status_code = getattr(exc, "status_code", None) or 500
            return False, None, None, status_code

        latency_ms = int((time.perf_counter() - start) * 1000)

        usage = getattr(response, "usage", None) or {}
        cache_hit = bool(getattr(response, "_cache_hit", False)) or bool(getattr(response, "cache_hit", False))

        metadata: Dict[str, Any] = {
            "resolution_source": "LLM_CACHE" if cache_hit else "LIVE_INFERENCE",
            "model": target_model,
            "latency_ms": max(latency_ms, 0),
            "input_tokens": _get_usage_field(usage, "prompt_tokens", "input_tokens"),
            "output_tokens": _get_usage_field(usage, "completion_tokens", "output_tokens"),
            "key_id": None if cache_hit else key_id,
            "fallback_attempts": 0,
        }

        reply = ""
        try:
            reply = response.choices[0].message.content or ""
        except Exception:
            reply = str(response)

        return True, reply, metadata, None

    def infer(
        self,
        system_prompt: Optional[str],
        history: List[Dict[str, str]],
        user_message: str,
        simulate_header: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """Run inference with multi-key failover.
        Returns (reply, metadata).
        Raises RuntimeError if all providers fail.
        """
        messages = _messages_to_list(system_prompt, history, user_message)
        simulation = parse_simulation_header(simulate_header)

        fallback_attempts = 0
        last_status = None

        chosen_model = model or self.default_model
        models_to_try = [chosen_model]
        if not simulation:
            for fallback_m in [
                "gemini/gemini-3.5-flash-lite",
            ]:
                if fallback_m not in models_to_try:
                    models_to_try.append(fallback_m)

        for cur_model in models_to_try:
            for key, key_id in zip(self.keys, self.key_ids):
                if is_key_simulated_failure(key_id, simulation):
                    fallback_attempts += 1
                    last_status = simulated_status_code(key_id, simulation) or 500
                    continue

                success, reply, metadata, status_code = self._call_single_key(
                    key, key_id, messages, simulation, model=cur_model
                )
                if success:
                    if metadata.get("resolution_source") == "LLM_CACHE":
                        metadata["fallback_attempts"] = 0
                        metadata["key_id"] = None
                    else:
                        metadata["fallback_attempts"] = fallback_attempts
                    return reply, metadata

                # If temporary upstream 503 spike, retry once after a short 0.5s pause
                if status_code == 503 and not simulation:
                    time.sleep(0.5)
                    retry_success, retry_reply, retry_meta, retry_status = self._call_single_key(
                        key, key_id, messages, simulation, model=cur_model
                    )
                    if retry_success:
                        if retry_meta.get("resolution_source") == "LLM_CACHE":
                            retry_meta["fallback_attempts"] = 0
                            retry_meta["key_id"] = None
                        else:
                            retry_meta["fallback_attempts"] = fallback_attempts
                        return retry_reply, retry_meta
                    status_code = retry_status

                fallback_attempts += 1
                last_status = status_code or 500

        raise RuntimeError(f"all providers unavailable (last status: {last_status})")
