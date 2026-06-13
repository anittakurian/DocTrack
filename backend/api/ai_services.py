import logging
from django.conf import settings
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Try configuring the generative AI package
GEMINI_AVAILABLE = False
try:
    if getattr(settings, 'GEMINI_API_KEY', None):
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
        logger.info("Gemini API successfully configured.")
    else:
        logger.warning("GEMINI_API_KEY is not defined. Falling back to Mock AI engine.")
except Exception as e:
    logger.error(f"Failed to initialize Gemini API: {e}. Falling back to Mock AI engine.")

def get_gemini_model():
    if not GEMINI_AVAILABLE:
        return None
    try:
        import google.generativeai as genai
        return genai.GenerativeModel('gemini-1.5-flash')
    except Exception as e:
        logger.error(f"Error loading Gemini Model: {e}")
        return None


def format_consultation_note(raw_text):
    """
    Formages raw symptoms input into structured clinical note formats (SOAP structure).
    """
    if not raw_text or not raw_text.strip():
        return ""

    model = get_gemini_model()
    if model:
        try:
            prompt = (
                "You are an AI Clinical Assistant. Format the following unstructured doctor's consultation notes "
                "into a neat, professional clinical summary. Organize it under headings such as Chief Complaint, "
                "Symptoms, Key Findings, Diagnosis (if mentioned), and Recommended Plan/Prescription. "
                "Do not invent any medical facts that are not present in the input. "
                f"Input:\n\n{raw_text}"
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini formatting failed: {e}. Using mock fallback.")

    # Rule-based / Mock Fallback
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    formatted = []
    
    # Simple formatting logic for mock fallback
    symptoms = []
    other = []
    
    for line in lines:
        lower_line = line.lower()
        if any(keyword in lower_line for keyword in ['fever', 'pain', 'headache', 'cough', 'cold', 'symptom', 'vomit', 'nausea']):
            symptoms.append(line)
        else:
            other.append(line)

    formatted.append("### Chief Complaint & Symptoms")
    if symptoms:
        for s in symptoms:
            formatted.append(f"- {s}")
    else:
        formatted.append("- Details: " + (lines[0] if lines else "Not specified"))

    if other:
        formatted.append("\n### Clinical Assessment & Plan")
        for o in other:
            formatted.append(f"- {o}")
            
    return "\n".join(formatted)


def generate_patient_summary(patient, records):
    """
    Summarizes historical consultation notes and EMR timeline of a patient.
    """
    if not records:
        return f"Patient {patient.first_name} {patient.last_name} has no historical medical records on file."

    # Build EMR timeline representation
    history_text = ""
    for r in records:
        history_text += f"Date: {r.visit_date}\nSymptoms: {r.symptoms}\nDiagnosis: {r.diagnosis}\nPrescription: {r.prescription}\nNotes: {r.notes}\n---\n"

    model = get_gemini_model()
    if model:
        try:
            prompt = (
                f"You are a medical scribe. Summarize the medical history of the patient: {patient.first_name} {patient.last_name}, "
                f"DOB: {patient.dob}, Gender: {patient.gender}, Blood Group: {patient.blood_group}. "
                f"Here is their EMR visit timeline history:\n\n{history_text}\n"
                "Create a concise medical summary summarizing their major historical conditions, recurring symptoms, "
                "active prescriptions, and overall health status. Keep it clear, concise, and professional."
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini summarization failed: {e}. Using mock fallback.")

    # Mock Fallback
    diagnoses = [r.diagnosis for r in records if r.diagnosis]
    prescriptions = [r.prescription for r in records if r.prescription]
    
    summary = (
        f"**Patient Summary (Mock Engine)**\n\n"
        f"Patient {patient.first_name} {patient.last_name} is a {patient.dob} born ({patient.gender}) patient "
        f"with {len(records)} visit(s) recorded in the clinic.\n\n"
        f"- **Primary Diagnoses Recorded**: {', '.join(set(diagnoses)) if diagnoses else 'None specified'}\n"
        f"- **Medication History**: {', '.join(set(prescriptions)) if prescriptions else 'No active prescriptions listed'}\n"
        f"- **Last Visit**: On {records[0].visit_date if records else 'N/A'}"
    )
    return summary


def run_ocr_on_report(file_bytes, mime_type):
    """
    Performs OCR and extracts medical entities (medicines, diagnoses, findings) from prescription/lab images using Gemini multimodal.
    """
    model = get_gemini_model()
    if model and mime_type.startswith('image/'):
        try:
            image = Image.open(io.BytesIO(file_bytes))
            prompt = (
                "You are an expert EMR data extraction tool. Analyze this medical report/prescription image. "
                "Extract the following details as structured text:\n"
                "1. Patient Name (if readable)\n"
                "2. Diagnosis / Clinical Findings\n"
                "3. Prescribed Medicines (with dosage/frequencies, if visible)\n"
                "4. Test Results / Lab parameters (if visible)\n\n"
                "Respond in clear, Markdown bullet points. Do not include unnecessary conversational text."
            )
            response = model.generate_content([prompt, image])
            return response.text
        except Exception as e:
            logger.error(f"Gemini OCR failed: {e}. Using mock fallback.")

    # Mock Fallback (supports PDF or image fallback)
    return (
        "### Extracted EMR Findings (Mock OCR Engine)\n\n"
        "- **Extracted Diagnoses**: Mild Hypertension / Vitamin D Deficiency\n"
        "- **Prescriptions Found**:\n"
        "  - Tab. Amlodipine 5mg (Once daily in the morning) - 30 Days\n"
        "  - Cap. Cholecalciferol 60,000 IU (Once weekly with milk) - 8 Weeks\n"
        "- **Test Results (Lab Report Indicators)**:\n"
        "  - Systolic BP: 142 mmHg\n"
        "  - Diastolic BP: 88 mmHg\n"
        "  - Vitamin D (25-OH): 18 ng/mL (Deficient)\n"
        "- **OCR Processing Status**: Completed successfully using fallback mock model."
    )
