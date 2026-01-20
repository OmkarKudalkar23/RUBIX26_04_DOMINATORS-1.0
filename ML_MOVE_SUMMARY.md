# ML Folder Move Summary

## ✅ Move Completed Successfully

The `ml\Mumbai_hacks` folder has been moved to `omkar\Mumbai_hacks\ml\Mumbai_hacks`.

## New Structure

```
omkar/Mumbai_hacks/
├── ml/
│   └── Mumbai_hacks/
│       └── Symtops_prediction/
│           ├── Diabeties_prediction/
│           │   ├── main.py
│           │   ├── diabetes_model.pkl
│           │   └── ...
│           └── Chronic_kidney_disease/
│               ├── main.py
│               ├── ckd_model.pkl
│               └── ...
├── backend/
└── Mumbai_hacks/ (frontend)
```

## Updated Paths

### ML Services
- **Diabetes Model**: `omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Diabeties_prediction/main.py`
- **CKD Model**: `omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Chronic_kidney_disease/main.py`

### Running ML Services

**Diabetes Service (Port 8000):**
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Diabeties_prediction
python main.py
```

**CKD Service (Port 8002):**
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Chronic_kidney_disease
python main.py
```

## Updated Documentation

The following files have been updated with the new paths:
1. ✅ `omkar/Mumbai_hacks/ML_SETUP_GUIDE.md`
2. ✅ `omkar/Mumbai_hacks/ML_INTEGRATION_SUMMARY.md`
3. ✅ `omkar/Mumbai_hacks/backend/ML_INTEGRATION_SETUP.md`

## Verification

✅ Both ML services are running successfully from the new location
✅ Models are loading correctly
✅ All paths updated in documentation
✅ No breaking changes to backend or frontend code

## Notes

- The backend code doesn't need changes as it calls ML services via HTTP (localhost:8000 and localhost:8002)
- Only the file paths in documentation were updated
- ML services use absolute paths for model files, so they work from any location

