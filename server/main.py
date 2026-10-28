"""
RADIX Talent Match Hackathon — Role 3: Profile Builder Backend
FastAPI server implementing Shared Data Contract endpoints and JSON persistence.
Reference: Participant Brief October 2026, Pages 8-10, 13
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import ValidationError

# Load .env file when present (development convenience)
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass  # python-dotenv not installed — rely on shell environment

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from .models import (
    CandidateProfile,
    ExtractedSkillListInput,
    ValidationResult,
    Skill
)
from .contract_validator import validate_candidate_profile
from .jd.router import router as jd_router
from .skill_match import router as match_router
from .storage import (
    init_storage,
    get_active_profile,
    set_active_profile,
    list_profiles,
    get_profile_by_id,
    save_profile,
    save_canonical_profile,
    ingest_from_analytics,
    get_company_skillsets,
    CANONICAL_OUTPUT_PATH,
    DATA_DIR
)

app = FastAPI(
    title="RADIX Talent Match — Role 3: Profile Builder API",
    description="Backend service providing save/load loop, schema contract validation, and analytics ingestion for RADIX Talent Match.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jd_router)
app.include_router(match_router)

@app.on_event("startup")
async def startup_event():
    init_storage()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "role": "Role 3: Profile Builder",
        "system": "RADIX Talent Match Hackathon",
        "contract_version": "v1.0",
        "categories_supported": 12,
        "shared_format": "JSON"
    }

@app.get("/api/profile", response_model=CandidateProfile)
def get_current_profile():
    """Retrieve the currently active candidate profile."""
    return get_active_profile()

@app.post("/api/profile", response_model=Dict[str, Any])
def update_profile(profile: CandidateProfile):
    """Save/update candidate profile and update canonical export file."""
    # Validate against Shared Data Contract
    validation = validate_candidate_profile(profile)
    saved = save_profile(profile)
    return {
        "message": "Candidate profile saved successfully.",
        "profile": saved,
        "validation": validation.model_dump()
    }

@app.get("/api/profiles")
def get_all_profiles():
    """List all saved candidate profiles in local JSON storage."""
    return {"profiles": list_profiles()}

@app.get("/api/profiles/{candidate_id}", response_model=CandidateProfile)
def get_single_profile(candidate_id: str):
    profile = get_profile_by_id(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found.")
    return profile

@app.post("/api/profiles/{candidate_id}/select", response_model=CandidateProfile)
def select_profile(candidate_id: str):
    """Switch active candidate profile."""
    profile = set_active_profile(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found.")
    return profile

@app.post("/api/profile/ingest-analytics", response_model=Dict[str, Any])
def ingest_analytics_payload(payload: ExtractedSkillListInput):
    """
    Ingest extracted skills & resume data from Role 2 Resume Parsing / Role 1 JD Analytics.
    Pre-fills the Profile Builder.
    """
    profile = ingest_from_analytics(payload)
    validation = validate_candidate_profile(profile)
    return {
        "message": f"Successfully ingested analytics input for '{profile.name}'.",
        "source_type": payload.source_type,
        "source_file": payload.source_file,
        "skills_imported": len(payload.skills),
        "profile": profile,
        "validation": validation.model_dump()
    }

@app.post("/api/contract/validate", response_model=ValidationResult)
def validate_contract(profile: CandidateProfile):
    """Validate a candidate profile against the RADIX 12-skillset shared contract."""
    return validate_candidate_profile(profile)

@app.get("/api/contract/export")
def export_contract():
    """
    Direct endpoint for downstream Role 4 (Talent Check) and Role 5 (Skill Matching).
    Returns the canonical candidate profile JSON.
    """
    active = get_active_profile()
    validation = validate_candidate_profile(active)
    return {
        "contract": "RADIX_SHARED_DATA_CONTRACT_V1",
        "role_handoff": "ROLE_3_TO_ROLE_4_AND_ROLE_5",
        "is_valid": validation.valid,
        "candidate_profile": active.model_dump()
    }

@app.get("/api/contract/download")
def download_canonical_json():
    """Download candidate_profile.json file."""
    if CANONICAL_OUTPUT_PATH.exists():
        return FileResponse(
            path=str(CANONICAL_OUTPUT_PATH),
            media_type="application/json",
            filename="candidate_profile.json"
        )
    raise HTTPException(status_code=404, detail="Canonical file not generated yet.")

@app.get("/api/talent-check-bars")
def get_talent_check_company_bars():
    """Returns company skill thresholds snapshot for Google, Microsoft, and Oracle FSS."""
    return get_company_skillsets()

@app.post("/api/upload-cv")
async def upload_cv_file(file: UploadFile = File(...)):
    """Upload candidate CV file (PDF/DOCX) and attach to profile."""
    cv_dir = DATA_DIR / "uploads"
    cv_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = cv_dir / file.filename
    content = await file.read()
    file_path.write_bytes(content)
    
    # Update active profile cv_file
    active = get_active_profile()
    active.cv_file = file.filename
    save_profile(active)
    
    return {
        "message": f"File '{file.filename}' uploaded and attached to active profile.",
        "filename": file.filename,
        "size_bytes": len(content)
    }


# ---------------------------------------------------------------------------
# Groq LLM Resume Skill Extraction
# ---------------------------------------------------------------------------

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}

@app.post("/api/resume/extract-skills")
async def extract_resume_skills(file: UploadFile = File(...)):
    """
    Upload a resume (PDF, DOCX, or TXT) and extract skills using Groq LLM.

    Returns structured skill data compatible with the Shared Data Contract.
    The GROQ_API_KEY environment variable must be set before calling this endpoint.
    """
    from .groq_service import extract_skills_with_groq, extract_text_from_file

    # --- Validate file type ---
    filename: str = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{ext}'. "
                "Please upload a PDF, DOCX, or TXT file."
            ),
        )

    # --- Read file with size guard ---
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File exceeds the 10 MB size limit.",
        )

    # --- Extract text ---
    try:
        resume_text = extract_text_from_file(filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # --- Call Groq ---
    try:
        skills = extract_skills_with_groq(resume_text)
    except RuntimeError as exc:
        # Missing API key — configuration error
        logger.error("Groq configuration error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        # Malformed LLM output
        logger.error("Groq output validation error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Skill extraction failed: {exc}",
        ) from exc
    except Exception as exc:
        # Provider errors, timeouts, etc.
        logger.error("Groq API error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error: {exc}",
        ) from exc

    return {
        "filename": filename,
        "skills_extracted": len(skills),
        "skills": skills,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="127.0.0.1", port=8000, reload=True)
