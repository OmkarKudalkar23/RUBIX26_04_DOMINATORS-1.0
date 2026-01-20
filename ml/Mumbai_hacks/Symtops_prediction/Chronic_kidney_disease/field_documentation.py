"""
CKD Prediction API Field Documentation
This file contains detailed field information for frontend development,
tooltips, and user guidance.
"""

FIELD_INFO = {
    "age": {
        "label": "Age",
        "description": "Patient age in years",
        "placeholder": "Enter age (e.g., 48)",
        "tooltip": "Age is a risk factor for chronic kidney disease",
        "range": "0-120",
        "unit": "years",
        "example": 48.0
    },
    "bp": {
        "label": "Blood Pressure",
        "description": "Blood pressure in millimeters of mercury (mm Hg)",
        "placeholder": "Enter BP (e.g., 120)",
        "tooltip": "Normal: 70-120 mm Hg. High blood pressure can damage kidneys.",
        "range": "50-180",
        "unit": "mm Hg",
        "example": 80.0
    },
    "sg": {
        "label": "Specific Gravity",
        "description": "Kidney's ability to concentrate urine",
        "placeholder": "Enter specific gravity (e.g., 1.020)",
        "tooltip": "Normal range: 1.005-1.025. Measures kidney concentration ability.",
        "range": "1.005-1.025",
        "unit": "",
        "example": 1.020
    },
    "al": {
        "label": "Albumin",
        "description": "Albumin protein level in urine",
        "placeholder": "Enter albumin level (0-5)",
        "tooltip": "Scale 0-5 (0=normal, 5=high). Protein in urine indicates kidney damage.",
        "range": "0-5",
        "unit": "scale",
        "example": 1.0
    },
    "su": {
        "label": "Sugar",
        "description": "Sugar (glucose) level in urine",
        "placeholder": "Enter sugar level (0-5)",
        "tooltip": "Scale 0-5 (0=normal, 5=high). May indicate diabetes or kidney issues.",
        "range": "0-5",
        "unit": "scale",
        "example": 0.0
    },
    "rbc": {
        "label": "Red Blood Cells",
        "description": "Red blood cell appearance in urine",
        "placeholder": "Select status",
        "tooltip": "Normal appearance or abnormal indicates potential kidney issues.",
        "options": ["normal", "abnormal"],
        "example": "normal"
    },
    "pc": {
        "label": "Pus Cell",
        "description": "Pus cell count in urine",
        "placeholder": "Select status",
        "tooltip": "Normal or abnormal levels indicate infection or inflammation.",
        "options": ["normal", "abnormal"],
        "example": "normal"
    },
    "pcc": {
        "label": "Pus Cell Clumps",
        "description": "Pus cell clumps in urine",
        "placeholder": "Select status",
        "tooltip": "Presence indicates urinary tract infection.",
        "options": ["present", "notpresent"],
        "example": "notpresent"
    },
    "ba": {
        "label": "Bacteria",
        "description": "Bacteria presence in urine",
        "placeholder": "Select status",
        "tooltip": "Presence indicates urinary tract infection.",
        "options": ["present", "notpresent"],
        "example": "notpresent"
    },
    "bgr": {
        "label": "Blood Glucose Random",
        "description": "Random blood glucose level",
        "placeholder": "Enter glucose level (e.g., 120)",
        "tooltip": "Normal: 70-140 mg/dl. High levels may indicate diabetes.",
        "range": "70-490",
        "unit": "mg/dl",
        "example": 120.0
    },
    "bu": {
        "label": "Blood Urea",
        "description": "Blood urea nitrogen level",
        "placeholder": "Enter blood urea (e.g., 36)",
        "tooltip": "Normal: 7-20 mg/dl. High levels suggest kidney problems.",
        "range": "1.5-391",
        "unit": "mg/dl",
        "example": 36.0
    },
    "sc": {
        "label": "Serum Creatinine",
        "description": "Serum creatinine level",
        "placeholder": "Enter creatinine (e.g., 1.2)",
        "tooltip": "Normal: 0.6-1.2 mg/dl. Key indicator of kidney function.",
        "range": "0.4-15",
        "unit": "mg/dl",
        "example": 1.2
    },
    "sod": {
        "label": "Sodium",
        "description": "Blood sodium level",
        "placeholder": "Enter sodium (e.g., 135)",
        "tooltip": "Normal: 135-145 mEq/L. Kidneys regulate sodium balance.",
        "range": "4.5-163",
        "unit": "mEq/L",
        "example": 135.0
    },
    "pot": {
        "label": "Potassium",
        "description": "Blood potassium level",
        "placeholder": "Enter potassium (e.g., 4.5)",
        "tooltip": "Normal: 3.5-5.0 mEq/L. Critical for heart and kidney function.",
        "range": "2.5-47",
        "unit": "mEq/L",
        "example": 4.5
    },
    "hemo": {
        "label": "Hemoglobin",
        "description": "Blood hemoglobin level",
        "placeholder": "Enter hemoglobin (e.g., 12.5)",
        "tooltip": "Normal: 12-16 g/dl. Low levels may indicate anemia from kidney disease.",
        "range": "3.1-17.8",
        "unit": "g/dl",
        "example": 12.5
    },
    "pcv": {
        "label": "Packed Cell Volume",
        "description": "Percentage of blood volume occupied by red cells",
        "placeholder": "Enter PCV (e.g., 44)",
        "tooltip": "Normal range: 32-45%. Related to hemoglobin levels.",
        "range": "32-45",
        "unit": "%",
        "example": 44.0
    },
    "wc": {
        "label": "White Blood Cell Count",
        "description": "White blood cell count in blood",
        "placeholder": "Enter WBC count (e.g., 7800)",
        "tooltip": "Normal: 4000-11000 cells/cumm. High levels indicate infection.",
        "range": "4000-11000",
        "unit": "cells/cumm",
        "example": 7800.0
    },
    "rc": {
        "label": "Red Blood Cell Count",
        "description": "Red blood cell count in blood",
        "placeholder": "Enter RBC count (e.g., 4.5)",
        "tooltip": "Normal: 3.6-6 million/cumm. Low levels indicate anemia.",
        "range": "3.6-6",
        "unit": "millions/cumm",
        "example": 4.5
    },
    "htn": {
        "label": "Hypertension",
        "description": "History of high blood pressure",
        "placeholder": "Select option",
        "tooltip": "High blood pressure is a major risk factor for kidney disease.",
        "options": ["yes", "no"],
        "example": "no"
    },
    "dm": {
        "label": "Diabetes Mellitus",
        "description": "History of diabetes",
        "placeholder": "Select option",
        "tooltip": "Diabetes is the leading cause of chronic kidney disease.",
        "options": ["yes", "no"],
        "example": "no"
    },
    "cad": {
        "label": "Coronary Artery Disease",
        "description": "History of heart artery disease",
        "placeholder": "Select option",
        "tooltip": "Heart disease and kidney disease often occur together.",
        "options": ["yes", "no"],
        "example": "no"
    },
    "appet": {
        "label": "Appetite",
        "description": "Patient's appetite status",
        "placeholder": "Select option",
        "tooltip": "Poor appetite can be a symptom of advanced kidney disease.",
        "options": ["good", "poor"],
        "example": "good"
    },
    "pe": {
        "label": "Pedal Edema",
        "description": "Swelling in feet and legs",
        "placeholder": "Select option",
        "tooltip": "Swelling indicates fluid retention, common in kidney disease.",
        "options": ["yes", "no"],
        "example": "no"
    },
    "ane": {
        "label": "Anemia",
        "description": "Low red blood cell count",
        "placeholder": "Select option",
        "tooltip": "Anemia is common in chronic kidney disease.",
        "options": ["yes", "no"],
        "example": "no"
    }
}

# Streamlit field configurations
STREAMLIT_CONFIG = {
    "age": {"min_value": 0, "max_value": 120, "value": 48, "step": 1},
    "bp": {"min_value": 50, "max_value": 180, "value": 80, "step": 1},
    "sg": {"min_value": 1.005, "max_value": 1.025, "value": 1.020, "step": 0.001},
    "al": {"min_value": 0, "max_value": 5, "value": 1, "step": 0.1},
    "su": {"min_value": 0, "max_value": 5, "value": 0, "step": 0.1},
    "bgr": {"min_value": 70, "max_value": 490, "value": 120, "step": 1},
    "bu": {"min_value": 1.5, "max_value": 391, "value": 36, "step": 0.1},
    "sc": {"min_value": 0.4, "max_value": 15, "value": 1.2, "step": 0.1},
    "sod": {"min_value": 4.5, "max_value": 163, "value": 135, "step": 1},
    "pot": {"min_value": 2.5, "max_value": 47, "value": 4.5, "step": 0.1},
    "hemo": {"min_value": 3.1, "max_value": 17.8, "value": 12.5, "step": 0.1},
    "pcv": {"min_value": 32, "max_value": 45, "value": 44, "step": 1},
    "wc": {"min_value": 4000, "max_value": 11000, "value": 7800, "step": 100},
    "rc": {"min_value": 3.6, "max_value": 6, "value": 4.5, "step": 0.1}
}

# Frontend form field types
FIELD_TYPES = {
    "age": "number",
    "bp": "number", 
    "sg": "number",
    "al": "number",
    "su": "number",
    "rbc": "select",
    "pc": "select",
    "pcc": "select",
    "ba": "select",
    "bgr": "number",
    "bu": "number",
    "sc": "number",
    "sod": "number",
    "pot": "number",
    "hemo": "number",
    "pcv": "number",
    "wc": "number",
    "rc": "number",
    "htn": "select",
    "dm": "select",
    "cad": "select",
    "appet": "select",
    "pe": "select",
    "ane": "select"
}

def get_field_info(field_name):
    """Get field information for a specific field"""
    return FIELD_INFO.get(field_name, {})

def get_all_fields():
    """Get all field information"""
    return FIELD_INFO

def get_streamlit_config(field_name):
    """Get Streamlit configuration for a field"""
    return STREAMLIT_CONFIG.get(field_name, {})

def get_field_type(field_name):
    """Get field type for frontend"""
    return FIELD_TYPES.get(field_name, "text")
