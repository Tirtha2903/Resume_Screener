import os
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity

# Define categories
CATEGORIES = [
    "Data Science",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "DevOps Engineer",
    "Mobile App Developer",
    "QA Engineer",
    "Human Resources (HR)",
    "Product Manager",
    "UI/UX Designer"
]

# Path configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "classifier.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")

# High-quality synthetic resume descriptions for training the classifier
TRAINING_DATA = [
    # Data Science
    ("Data Scientist with 3+ years of experience building machine learning models, predictive analytics pipelines, and data visualization tools. Proficient in Python, pandas, numpy, scikit-learn, TensorFlow, PyTorch, and SQL. Developed neural networks and predictive algorithms that boosted sales prediction accuracy by 20%. Experienced with regression, classification, clustering, NLP, and Deep Learning.", "Data Science"),
    ("Machine Learning Engineer focused on NLP and computer vision. Strong background in statistics, data analysis, deep learning, PyTorch, Keras, TensorFlow, Jupyter notebooks, Docker, AWS, and SQL. Trained transformer models for sentiment analysis and implemented OCR pipelines for document parsing.", "Data Science"),
    ("Data Analyst and Data Scientist with expertise in statistical modeling, R, Python, SQL, Tableau, Power BI, and Excel. Experienced in translating complex datasets into actionable business insights. Managed ETL processes, cleaned structured and unstructured data, and designed interactive analytics dashboards.", "Data Science"),
    
    # Frontend Developer
    ("Frontend Developer specializing in building responsive, accessible, and fast web applications. Highly skilled in HTML5, CSS3, JavaScript (ES6+), React.js, TypeScript, Next.js, Tailwind CSS, Redux, and Webpack. Dedicated to writing clean, semantic code and optimizing web performance for SEO.", "Frontend Developer"),
    ("Web Developer and UI Engineer with a passion for frontend technologies. Expert in HTML, CSS, JavaScript, Vue.js, Pinia, Sass, Bootstrap, and Vite. Experienced in responsive web design, mobile-first design, cross-browser compatibility, and testing with Jest and Cypress.", "Frontend Developer"),
    ("React Developer with 4 years of experience crafting interactive user interfaces. Skilled in React hooks, state management, React Router, GraphQL, Apollo, TypeScript, and modern CSS frameworks. Developed responsive dashboards, integrated REST APIs, and improved page load speeds by 40%.", "Frontend Developer"),

    # Backend Developer
    ("Backend Engineer with strong experience in building scalable RESTful APIs and microservices. Proficient in Python (Django, FastAPI, Flask), Node.js (Express), Java (Spring Boot), and Go. Experienced with PostgreSQL, MongoDB, Redis, MySQL, and database optimization techniques.", "Backend Developer"),
    ("Software Engineer specialized in backend development and system design. Solid background in object-oriented programming (OOP), design patterns, and database design. Built robust APIs, managed microservices architectures, implemented JWT authentication, and scaled message queues using RabbitMQ/Kafka.", "Backend Developer"),
    ("Java Developer and Backend Architect. Expert in Java, Spring Boot, Hibernate, microservices, PostgreSQL, Docker, AWS (EC2, S3, RDS), and unit testing with JUnit. Developed secure transaction systems, optimized backend database queries, and integrated third-party payment gateways.", "Backend Developer"),

    # Full Stack Developer
    ("Full Stack Developer with comprehensive knowledge in both frontend and backend systems. Experienced in MERN stack (MongoDB, Express, React, Node.js), JavaScript, TypeScript, SQL, Git, and Docker. Built end-to-end web applications, handled authentication, data syncing, and cloud deployment on AWS/Heroku.", "Full Stack Developer"),
    ("Senior Full Stack Engineer working with React, Next.js, Django, and PostgreSQL. Experienced in the complete software development lifecycle (SDLC), from database schema design to responsive CSS styling. Integrated RESTful APIs, set up OAuth2, and implemented real-time web socket connections.", "Full Stack Developer"),
    ("Full Stack Software Developer proficient in Python, FastAPI, React, Tailwind CSS, PostgreSQL, and Git. Focused on rapid development and deploying production-ready code. Designed database schemas, built API routes, and created elegant UI components.", "Full Stack Developer"),

    # DevOps Engineer
    ("DevOps Engineer and Site Reliability Engineer (SRE) with 5 years of experience automating cloud infrastructure. Expertise in AWS, Azure, Docker, Kubernetes, Terraform, Ansible, Jenkins, Git, and CI/CD pipelines. Managed Linux systems, optimized server security, and configured monitoring using Prometheus and Grafana.", "DevOps Engineer"),
    ("Cloud Infrastructure Architect specializing in automating software delivery. Skilled in CI/CD pipelines, Docker, Kubernetes, AWS, Bash scripting, Python, Terraform, and cloud security. Reduced deployment time by 60% using automated pipelines and containerized microservices architectures.", "DevOps Engineer"),
    ("System Administrator and DevOps Engineer. Proven track record in configuring Jenkins servers, writing Dockerfiles, managing Kubernetes clusters, writing shell scripts, and configuring Nginx reverse proxies. Experienced with Linux commands, SSH, firewall configs, and CloudWatch logging.", "DevOps Engineer"),

    # Mobile App Developer
    ("Mobile Application Developer with 3+ years of experience creating high-performance iOS and Android applications. Skilled in Swift, SwiftUI, Objective-C, Xcode, Kotlin, Android Studio, and Java. Developed and published 5 native mobile applications on the Apple App Store and Google Play Store.", "Mobile App Developer"),
    ("Flutter and React Native Developer specializing in cross-platform mobile development. Proficient in Dart, JavaScript, TypeScript, state management (Bloc, Provider, Redux), mobile UI/UX, and push notifications. Integrated local SQLite databases and synced data with REST APIs.", "Mobile App Developer"),
    ("iOS Engineer with expertise in Swift, SwiftUI, CoreData, Cocoapods, and App Store Connect. Passionate about animations, responsive mobile design, clean architecture (MVVM), and offline-first capabilities. Optimized app memory footprint and reduced startup time by 25%.", "Mobile App Developer"),

    # QA Engineer
    ("QA Automation Engineer with expertise in software testing methodologies. Proficient in writing automated test scripts using Selenium WebDriver, Cypress, Java, JavaScript, and Python. Experienced in manual testing, API testing (Postman), bug tracking with JIRA, regression testing, and CI/CD integration.", "QA Engineer"),
    ("Software Development Engineer in Test (SDET) specializing in test automation frameworks. Built framework architectures from scratch using PyTest and Playwright. Conducted load testing with JMeter, integrated test suites with Jenkins pipelines, and reduced release cycle testing time by 50%.", "QA Engineer"),
    ("QA Analyst experienced in black-box testing, white-box testing, smoke testing, and system integration testing. Meticulous documenter of bugs, test cases, and test plans. Experienced working in Agile Scrum teams and facilitating bug triage meetings.", "QA Engineer"),

    # Human Resources (HR)
    ("Human Resources Generalist and Recruiter with 4+ years of experience in talent acquisition, sourcing, screening resumes, employee relations, onboarding, and performance management. Proficient in utilizing Applicant Tracking Systems (ATS) and HRIS databases. Excellent communication and mediation skills.", "Human Resources (HR)"),
    ("Talent Acquisition Specialist focused on recruiting technical professionals. Experienced in candidate sourcing via LinkedIn Recruiter, conducting preliminary interviews, negotiating job offers, and building talent pipelines. Managed full-cycle recruitment for fast-growing startup teams.", "Human Resources (HR)"),
    ("HR Manager specialized in employee engagement, workplace policies, compliance, conflict resolution, and compensation structures. Designed onboarding programs that improved employee retention by 15%. Skilled in implementing labor laws and conducting training workshops.", "Human Resources (HR)"),

    # Product Manager
    ("Product Manager with a proven track record of launching user-centric SaaS products. Skilled in agile methodologies, scrum, product roadmap design, user story mapping, customer interviews, and market analysis. Collaborated closely with engineering and design teams to deliver high-value features.", "Product Manager"),
    ("Technical Product Manager with a background in software engineering. Skilled in defining product strategy, tracking KPIs, SQL data analysis, and translating business goals into technical requirements. Managed sprint backlogs in JIRA and led daily stand-ups and sprint planning sessions.", "Product Manager"),
    ("Product Owner and Project Manager with experience in managing product lifecycles. Expert in wireframing tools, Figma, user persona research, market positioning, and cross-functional leadership. Successfully delivered mobile and web applications with a 20% growth in active users.", "Product Manager"),

    # UI/UX Designer
    ("UI/UX Designer with a passion for designing beautiful, intuitive, and user-friendly interfaces. Proficient in Figma, Adobe Creative Suite (Photoshop, Illustrator, XD), Sketch, and InVision. Experienced in conducting user research, building interactive prototypes, and designing high-fidelity layouts.", "UI/UX Designer"),
    ("Product Designer and Visual Artist specializing in web and mobile app design systems. Expert in user persona creation, user journey mapping, wireframing, typography, color theory, and responsive layouts. Designed interfaces for e-commerce, dashboard platforms, and social networks.", "UI/UX Designer"),
    ("UX Researcher and Interface Designer focused on human-centered design. Conducted usability testing, A/B testing, and analyzed user feedback. Designed wireframes, workflows, and visual design libraries. Collaborated with developers to ensure pixel-perfect CSS styling implementation.", "UI/UX Designer")
]

# Duplicate/expand training data slightly to make Logistic Regression stable
EXPANDED_TRAINING_DATA = TRAINING_DATA * 4  # 30 * 4 = 120 samples

def train_model():
    """Train the TF-IDF Vectorizer and Logistic Regression Classifier"""
    texts = [text for text, label in EXPANDED_TRAINING_DATA]
    labels = [label for text, label in EXPANDED_TRAINING_DATA]
    
    # Custom vectorizer with n-grams and English stop words
    vectorizer = TfidfVectorizer(
        sublinear_tf=True,
        max_df=0.5,
        min_df=1,
        ngram_range=(1, 2),
        stop_words='english'
    )
    
    X = vectorizer.fit_transform(texts)
    y = labels
    
    # Train Logistic Regression with high regularization penalty control
    classifier = LogisticRegression(C=1.0, max_iter=200, random_state=42)
    classifier.fit(X, y)
    
    # Save the models
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(classifier, f)
    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)
        
    print(f"Model trained successfully. Categories: {len(CATEGORIES)}")
    print(f"Vectorizer saved to: {VECTORIZER_PATH}")
    print(f"Classifier saved to: {MODEL_PATH}")
    return vectorizer, classifier

def get_model():
    """Load vectorizer and classifier. Train them if they don't exist."""
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        return train_model()
    
    with open(MODEL_PATH, "rb") as f:
        classifier = pickle.load(f)
    with open(VECTORIZER_PATH, "rb") as f:
        vectorizer = pickle.load(f)
        
    return vectorizer, classifier

def predict_category(text: str):
    """Predict the category of the resume and return confidence"""
    try:
        vectorizer, classifier = get_model()
        X = vectorizer.transform([text])
        prediction = classifier.predict(X)[0]
        
        # Get probability distribution
        probabilities = classifier.predict_proba(X)[0]
        confidence = max(probabilities) * 100
        
        return prediction, round(confidence, 2)
    except Exception as e:
        print(f"Error predicting category: {e}")
        return "Unknown", 0.0

def calculate_match_score(resume_text: str, jd_text: str) -> float:
    """Calculate raw text similarity using TF-IDF and Cosine Similarity"""
    if not resume_text.strip() or not jd_text.strip():
        return 0.0
    try:
        similarity_vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = similarity_vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(similarity) * 100, 2)
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0.0


def calculate_satisfaction_score(resume_text: str, jd_text: str, resume_skills: list, jd_skills: list) -> float:
    """
    Weighted satisfaction score (0-100):
      - 40% skill match ratio
      - 40% TF-IDF text similarity
      - 20% resume completeness signals
    """
    # Skill match component (40%)
    if jd_skills:
        resume_skills_lower = set(s.lower() for s in resume_skills)
        jd_skills_lower = set(s.lower() for s in jd_skills)
        matched = resume_skills_lower.intersection(jd_skills_lower)
        skill_score = (len(matched) / max(len(jd_skills_lower), 1)) * 100
    else:
        skill_score = 50.0  # Neutral when no JD skills given

    # Text similarity component (40%)
    text_sim = calculate_match_score(resume_text, jd_text)

    # Completeness component (20%) — checks for key resume signals
    completeness = 0
    completeness_checks = [
        r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}',   # email
        r'\b(?:\+?\d[\d\s\-().]{7,})\b',                      # phone
        r'\b(experience|worked|years|built|developed|designed)\b',  # experience section
        r'\b(education|university|college|degree|bachelor|master)\b',  # education
        r'\b(skills|proficient|expertise|technologies)\b',    # skills section
    ]
    import re
    text_lower = resume_text.lower()
    for pattern in completeness_checks:
        if re.search(pattern, text_lower):
            completeness += 20
    completeness = min(completeness, 100)

    total = (skill_score * 0.40) + (text_sim * 0.40) + (completeness * 0.20)
    return round(min(total, 100.0), 1)


def generate_improvement_suggestions(resume_text: str, jd_text: str, missing_skills: list, category: str) -> dict:
    """
    Generate structured improvement suggestions and a copyable AI prompt.
    Returns a dict with sections: suggestions (list), prompt (str), priority_areas (list).
    """
    import re

    text_lower = resume_text.lower()

    # Detect which resume sections are missing or weak
    missing_sections = []
    has_email = bool(re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', resume_text))
    has_phone = bool(re.search(r'\b(?:\+?\d[\d\s\-().]{7,})\b', resume_text))
    has_education = bool(re.search(r'\b(education|university|college|degree|bachelor|master|b\.?s\.?|m\.?s\.?)\b', text_lower))
    has_experience = bool(re.search(r'\b(experience|worked|years|built|developed|designed|led|managed)\b', text_lower))
    has_summary = bool(re.search(r'\b(summary|objective|profile|about me|overview)\b', text_lower))
    has_certifications = bool(re.search(r'\b(certified|certification|certificate|aws certified|google certified|pmp|coursera|udemy)\b', text_lower))
    has_github = bool(re.search(r'\b(github|gitlab|portfolio|projects)\b', text_lower))
    has_quantified = bool(re.search(r'\b(\d+%|\d+ percent|increased|decreased|reduced|improved by|grew)\b', text_lower))

    suggestions = []
    priority_areas = []

    if not has_email or not has_phone:
        suggestions.append({
            "section": "Contact Information",
            "priority": "High",
            "action": "Add a professional email address and phone number at the top of your resume."
        })
        priority_areas.append("Contact Information")

    if not has_summary:
        suggestions.append({
            "section": "Professional Summary",
            "priority": "High",
            "action": f"Add a 3-4 sentence professional summary highlighting your experience as a {category}, key strengths, and career goals."
        })
        priority_areas.append("Professional Summary")

    if not has_experience:
        suggestions.append({
            "section": "Work Experience",
            "priority": "High",
            "action": "Add detailed work experience entries with company name, role title, dates, and bullet points describing your responsibilities and achievements."
        })
        priority_areas.append("Work Experience")

    if not has_quantified:
        suggestions.append({
            "section": "Impact Metrics",
            "priority": "Medium",
            "action": "Quantify your achievements. E.g., 'Reduced page load time by 40%', 'Managed a team of 5 engineers', 'Increased conversion rate by 15%'."
        })
        priority_areas.append("Impact Metrics")

    if not has_education:
        suggestions.append({
            "section": "Education",
            "priority": "Medium",
            "action": "Add your educational background including degree, institution name, graduation year, and any relevant coursework or GPA."
        })
        priority_areas.append("Education")

    if missing_skills:
        top_missing = missing_skills[:8]
        suggestions.append({
            "section": "Technical Skills",
            "priority": "High",
            "action": f"Add the following skills that are required by the job description: {', '.join(top_missing)}. Include them in your Skills section and demonstrate usage in your work experience."
        })
        priority_areas.append("Technical Skills")

    if not has_certifications:
        suggestions.append({
            "section": "Certifications",
            "priority": "Low",
            "action": f"Consider adding relevant certifications for a {category} role (e.g., AWS Certified Developer, Google Cloud, Meta Developer Certification, etc.)."
        })

    if not has_github:
        suggestions.append({
            "section": "Portfolio / Projects",
            "priority": "Medium",
            "action": "Add a link to your GitHub, portfolio, or personal projects. Include 2-3 project descriptions with tech stack used and outcomes."
        })
        priority_areas.append("Portfolio / Projects")

    # Build the copyable ChatGPT prompt
    jd_snippet = jd_text[:800].strip() if jd_text else "Not provided"
    resume_snippet = resume_text[:1200].strip()
    missing_str = ", ".join(missing_skills[:10]) if missing_skills else "None identified"
    missing_sections_str = ", ".join(priority_areas) if priority_areas else "None"

    prompt = f"""You are an expert resume writer. I need you to help me improve my resume for a specific job application.

=== JOB DESCRIPTION ===
{jd_snippet}

=== MY CURRENT RESUME ===
{resume_snippet}

=== WHAT'S MISSING ===
- Missing skills required by the JD: {missing_str}
- Weak/missing resume sections: {missing_sections_str}

=== INSTRUCTIONS ===
Please rewrite and improve my resume by:
1. Adding a strong Professional Summary (3-4 sentences) tailored to this job
2. Incorporating the missing skills ({missing_str}) into the Skills section and Work Experience naturally
3. Strengthening my Work Experience bullet points with quantified achievements (numbers, percentages, scale)
4. Adding any missing sections (Education, Certifications, GitHub/Portfolio links if relevant)
5. Keeping a clean, ATS-friendly format

Please return the COMPLETE improved resume text that I can copy directly. Do NOT use markdown formatting or asterisks — use plain text with clear section headers in ALL CAPS."""

    return {
        "suggestions": suggestions,
        "prompt": prompt,
        "priority_areas": priority_areas,
        "missing_sections": {
            "has_email": has_email,
            "has_phone": has_phone,
            "has_education": has_education,
            "has_experience": has_experience,
            "has_summary": has_summary,
            "has_certifications": has_certifications,
            "has_github": has_github,
            "has_quantified_metrics": has_quantified,
        }
    }


if __name__ == "__main__":
    print("Testing ML model training...")
    train_model()

    test_text = "I am a Senior Software Developer with expertise in React, Node, Express, MongoDB, HTML, CSS, JavaScript, TypeScript, AWS, CI/CD, Docker and Git."
    category, confidence = predict_category(test_text)
    print(f"Test prediction: '{category}' with {confidence}% confidence.")

    jd = "We are hiring a Full Stack Developer with React, Node.js, and TypeScript skills."
    score = calculate_match_score(test_text, jd)
    print(f"Text Similarity Score: {score}%")

    sat = calculate_satisfaction_score(test_text, jd, ["React", "Node.js", "TypeScript"], ["React", "Node.js", "TypeScript", "Docker"])
    print(f"Weighted Satisfaction Score: {sat}%")
