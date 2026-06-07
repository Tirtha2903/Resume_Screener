import os
import shutil
import tempfile
from typing import List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from parser import parse_resume, extract_skills
from model import predict_category, calculate_match_score, train_model

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
                    
                    # Skill gap analysis
                    resume_skills_set = set(parsed_data["skills"])
                    matched_skills = sorted(list(resume_skills_set.intersection(jd_skills)))
                    missing_skills = sorted(list(jd_skills.difference(resume_skills_set)))
                    additional_skills = sorted(list(resume_skills_set.difference(jd_skills)))
                else:
                    # If no JD, additional skills are just the parsed skills
                    additional_skills = parsed_data["skills"]
                
                results.append({
                    "filename": filename,
                    "name": parsed_data["name"],
                    "email": parsed_data["email"] or "Not found",
                    "phone": parsed_data["phone"] or "Not found",
                    "skills": parsed_data["skills"],
                    "category": category,
                    "confidence": confidence,
                    "match_score": match_score,
                    "analysis": {
                        "matched_skills": matched_skills,
                        "missing_skills": missing_skills,
                        "additional_skills": additional_skills,
                    },
                    "text_preview": parsed_data["raw_text"][:1000] + ("..." if len(parsed_data["raw_text"]) > 1000 else "")
                })
            except Exception as e:
                # Log parsing error for this specific file, but continue with others
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
                    "analysis": {
                        "matched_skills": [],
                        "missing_skills": list(jd_skills),
                        "additional_skills": [],
                    },
                    "text_preview": f"Error occurred during file parsing: {str(e)}"
                })
                
    finally:
        # Cleanup temporary files
        shutil.rmtree(temp_dir)
        
    return {
        "status": "success",
        "count": len(results),
        "results": sorted(results, key=lambda x: x["match_score"], reverse=True)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
