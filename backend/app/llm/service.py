"""
LLM integration layer.

Provider: Groq (https://console.groq.com) — chosen because it is genuinely free
with no credit card required, has generous rate limits (see README for the
comparison against Gemini / OpenRouter / HF Inference), and is fast enough that
pre-visit summaries return before the patient finishes the booking flow.

Every call is wrapped so that an LLM outage, timeout, malformed response, or
missing API key NEVER breaks the booking/visit flow. On failure we store a
clearly-flagged fallback object/string and set a `*_llm_failed` flag on the
Appointment so the frontend can show "AI summary unavailable, please read
symptoms/notes manually" instead of crashing or silently lying.
"""
import json
import logging

from flask import current_app

logger = logging.getLogger(__name__)

PREVISIT_PROMPT = (
    "Analyse these symptoms and return: urgency level (Low / Medium / High), "
    "chief complaint, and three suggested questions for the doctor. "
    "Symptoms: {symptoms}\n\n"
    "Respond ONLY with valid JSON in exactly this shape, no markdown, no prose:\n"
    '{{"urgency": "Low|Medium|High", "chief_complaint": "...", '
    '"suggested_questions": ["...", "...", "..."]}}'
)

POSTVISIT_PROMPT = (
    "Convert these clinical notes into a patient-friendly summary with "
    "medication schedule and follow-up steps: {notes}\n\n"
    "Write in plain, warm, non-technical language a patient can understand. "
    "Use short sections: 'What the doctor found', 'Your medicines', "
    "'Follow-up steps'. Keep it under 200 words."
)


def _get_client():
    api_key = current_app.config.get("GROQ_API_KEY")
    if not api_key or api_key.startswith("gsk_your_free"):
        return None
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Could not initialise Groq client: %s", exc)
        return None


def _fallback_previsit(symptoms: str):
    return {
        "urgency": "Medium",
        "chief_complaint": (symptoms or "")[:200],
        "suggested_questions": [
            "Could you describe when the symptoms started?",
            "Have the symptoms changed in severity recently?",
            "Are you currently taking any other medication?",
        ],
        "note": "AI summary unavailable — showing raw symptoms and default questions. Please review manually.",
    }


def _fallback_postvisit(notes: str):
    return (
        "AI summary is temporarily unavailable. Below are the doctor's raw notes "
        f"and prescription — please read them carefully or contact the clinic if anything is unclear.\n\n{notes}"
    )


def generate_previsit_summary(symptoms: str):
    """Returns (summary_dict, llm_failed: bool)."""
    client = _get_client()
    if client is None:
        return _fallback_previsit(symptoms), True

    try:
        resp = client.chat.completions.create(
            model=current_app.config["GROQ_MODEL"],
            messages=[{"role": "user", "content": PREVISIT_PROMPT.format(symptoms=symptoms)}],
            temperature=0.2,
            max_tokens=600,
            timeout=15,
        )
        raw = resp.choices[0].message.content.strip()
        # Strip think tags (Qwen/reasoning models)
        import re as _re
        raw = _re.sub(r"<think>.*?</think>", "", raw, flags=_re.DOTALL).strip()
        # Strip markdown fences
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        # Extract JSON object if embedded in prose
        json_match = _re.search(r"\{.*\}", raw, _re.DOTALL)
        if json_match:
            raw = json_match.group(0)
        data = json.loads(raw)
        if "urgency" not in data or "chief_complaint" not in data:
            raise ValueError("missing expected keys")
        data.setdefault("suggested_questions", [])
        return data, False
    except Exception as exc:
        logger.warning("Pre-visit LLM call failed, using fallback: %s", exc)
        return _fallback_previsit(symptoms), True


def generate_postvisit_summary(notes: str):
    """Returns (summary_text, llm_failed: bool)."""
    client = _get_client()
    if client is None:
        return _fallback_postvisit(notes), True

    try:
        resp = client.chat.completions.create(
            model=current_app.config["GROQ_MODEL"],
            messages=[{"role": "user", "content": POSTVISIT_PROMPT.format(notes=notes)}],
            temperature=0.3,
            max_tokens=2000,
            timeout=20,
        )
        import re as _re
        text = resp.choices[0].message.content.strip()
        # 1. Strip complete <think>…</think> blocks
        text = _re.sub(r"<think>.*?</think>", "", text, flags=_re.DOTALL).strip()
        # 2. If the model was cut mid-think, strip everything up to the last </think>
        if "<think>" in text and "</think>" not in text:
            text = text.split("<think>")[0].strip()
        if not text:
            raise ValueError("empty response after think-tag stripping")
        return text, False
    except Exception as exc:
        logger.warning("Post-visit LLM call failed, using fallback: %s", exc)
        return _fallback_postvisit(notes), True
