import os
import shutil
import tempfile
from typing import List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from parser import parse_resume, extract_skills
from model import (
    predict_category, calculate_match_score, train_model,
    calculate_satisfaction_score, generate_improvement_suggestions
)

app = FastAPI(title="AI Resume Screener & Parser", version="1.0.0")

# Enable CORS for React frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """Basic health check endpoint"""
    return {"status": "healthy", "message": "Resume screening API is operational"}

@app.post("/api/train")
def train_model_endpoint():
    """Force retrain the ML classifier"""
    try:
        train_model()
        return {"status": "success", "message": "ML model retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to train model: {str(e)}")

@app.post("/api/screen")
async def screen_resumes(
    files: List[UploadFile] = File(...),
    job_description: str = Form("")
):
    """
    Upload multiple resumes, extract details, classify, 
    and match them against the provided Job Description.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No resume files uploaded")
        
    results = []
    temp_dir = tempfile.mkdtemp()
    
    # Pre-extract skills from Job Description for skill gap analysis
    jd_skills = set(extract_skills(job_description)) if job_description.strip() else set()
    
    try:
        for file in files:
            # Validate file extension
            filename = file.filename or "resume.pdf"
            _, ext = os.path.splitext(filename.lower())
            if ext not in [".pdf", ".docx", ".txt"]:
                # Skip unsupported formats silently or log it
                continue
                
            # Write uploaded file to temporary path
            temp_file_path = os.path.join(temp_dir, filename)
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            try:
                # Parse resume content
                parsed_data = parse_resume(temp_file_path, filename=filename)
                
                # ML Categorization
                category, confidence = predict_category(parsed_data["raw_text"])
                
                # ML Job Match Scoring
                match_score = 0.0
                matched_skills = []
                missing_skills = []
                additional_skills = []
                
                if job_description.strip():
                    match_score = calculate_match_score(parsed_data["raw_text"], job_description)
                    jd_skills_list = list(jd_skills)
                    
                    # Skill gap analysis
                    resume_skills_set = set(parsed_data["skills"])
                    matched_skills = sorted(list(resume_skills_set.intersection(jd_skills)))
                    missing_skills = sorted(list(jd_skills.difference(resume_skills_set)))
                    additional_skills = sorted(list(resume_skills_set.difference(jd_skills)))
                    
                    # Weighted satisfaction score
                    satisfaction_score = calculate_satisfaction_score(
                        parsed_data["raw_text"], job_description,
                        parsed_data["skills"], jd_skills_list
                    )
                else:
                    # If no JD, additional skills are just the parsed skills
                    additional_skills = parsed_data["skills"]
                    satisfaction_score = 0.0
                
                results.append({
                    "filename": filename,
                    "name": parsed_data["name"],
                    "email": parsed_data["email"] or "Not found",
                    "phone": parsed_data["phone"] or "Not found",
                    "skills": parsed_data["skills"],
                    "category": category,
                    "confidence": confidence,
                    "match_score": match_score,
                    "satisfaction_score": satisfaction_score,
                    "analysis": {
                        "matched_skills": matched_skills,
                        "missing_skills": missing_skills,
                        "additional_skills": additional_skills,
                    },
                    "raw_text": parsed_data["raw_text"],
                    "text_preview": parsed_data["raw_text"][:1000] + ("..." if len(parsed_data["raw_text"]) > 1000 else "")
                })
            except Exception as e:
                print(f"Error parsing resume {filename}: {e}")
                results.append({
                    "filename": filename,
                    "name": "Failed to Parse",
                    "email": "Error",
                    "phone": "Error",
                    "skills": [],
                    "category": "Error",
                    "confidence": 0.0,
                    "match_score": 0.0,
                    "satisfaction_score": 0.0,
                    "analysis": {
                        "matched_skills": [],
                        "missing_skills": list(jd_skills),
                        "additional_skills": [],
                    },
                    "raw_text": "",
                    "text_preview": f"Error occurred during file parsing: {str(e)}"
                })
                
    finally:
        shutil.rmtree(temp_dir)
        
    return {
        "status": "success",
        "count": len(results),
        "results": sorted(results, key=lambda x: x["satisfaction_score"], reverse=True)
    }


@app.post("/api/improve")
async def get_improvement_plan(
    resume_text: str = Form(...),
    job_description: str = Form(""),
    category: str = Form("Unknown")
):
    """
    Given raw resume text and a JD, return:
    - Structured improvement suggestions per section
    - A copyable AI prompt for ChatGPT/Claude
    - Current satisfaction score
    - Missing skills and sections
    """
    jd_skills = list(extract_skills(job_description)) if job_description.strip() else []
    resume_skills = list(extract_skills(resume_text))
    
    resume_skills_set = set(resume_skills)
    jd_skills_set = set(jd_skills)
    missing_skills = sorted(list(jd_skills_set.difference(resume_skills_set)))
    
    satisfaction_score = calculate_satisfaction_score(
        resume_text, job_description, resume_skills, jd_skills
    )
    
    improvement_data = generate_improvement_suggestions(
        resume_text, job_description, missing_skills, category
    )
    
    return {
        "status": "success",
        "satisfaction_score": satisfaction_score,
        "target_score": 95.0,
        "missing_skills": missing_skills,
        "improvement_plan": improvement_data,
    }


@app.post("/api/rescreen")
async def rescreen_resume(
    updated_resume_text: str = Form(...),
    job_description: str = Form(""),
    original_category: str = Form("Unknown")
):
    """
    Re-evaluate an updated resume text without needing a file upload.
    Used for the improvement loop.
    """
    from parser import extract_skills, extract_email, extract_phone, extract_name, clean_text
    
    cleaned_text = clean_text(updated_resume_text)
    resume_skills = list(extract_skills(cleaned_text))
    jd_skills = list(extract_skills(job_description)) if job_description.strip() else []
    
    # Re-predict category
    category, confidence = predict_category(cleaned_text)
    
    # Scoring
    match_score = calculate_match_score(cleaned_text, job_description) if job_description.strip() else 0.0
    satisfaction_score = calculate_satisfaction_score(cleaned_text, job_description, resume_skills, jd_skills)
    
    resume_skills_set = set(resume_skills)
    jd_skills_set = set(jd_skills)
    matched_skills = sorted(list(resume_skills_set.intersection(jd_skills_set)))
    missing_skills = sorted(list(jd_skills_set.difference(resume_skills_set)))
    additional_skills = sorted(list(resume_skills_set.difference(jd_skills_set)))
    
    # Generate updated improvement suggestions
    improvement_data = generate_improvement_suggestions(
        cleaned_text, job_description, missing_skills, category
    )
    
    return {
        "status": "success",
        "category": category,
        "confidence": confidence,
        "match_score": match_score,
        "satisfaction_score": satisfaction_score,
        "target_score": 95.0,
        "skills": resume_skills,
        "analysis": {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "additional_skills": additional_skills,
        },
        "improvement_plan": improvement_data,
        "text_preview": cleaned_text[:1000] + ("..." if len(cleaned_text) > 1000 else "")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

