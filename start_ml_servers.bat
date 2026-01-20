@echo off
echo Starting ML Servers...

start "Diabetes Prediction Model" cmd /k "cd ml\Mumbai_hacks\Symtops_prediction\Diabeties_prediction && python main.py"
start "CKD Prediction Model" cmd /k "cd ml\Mumbai_hacks\Symtops_prediction\Chronic_kidney_disease && python main.py"

echo ML Servers starting in background windows...
