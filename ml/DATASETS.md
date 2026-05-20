# MEDISENSE Dataset Notes

This MVP is structured to train from open symptom and CBC datasets, then fall back to conservative clinical rules when coverage is incomplete or the model confidence is low.

## Selected Sources

- Kaggle Disease Prediction Using Machine Learning / Disease and Symptoms datasets: symptom-to-disease multi-label rows for general disease prediction.
- Kaggle Complete Blood Count datasets: CBC marker distributions for report-value trend validation and abnormal-value flagging.
- Kaggle dengue clinical datasets and public dengue case definitions: fever, low platelets, low WBC, rash, bleeding, abdominal pain, vomiting, and warning-sign features.
- Public malaria and typhoid clinical feature references from WHO/CDC-style open guidance: fever pattern, chills, sweating, abdominal symptoms, weakness, diarrhea/constipation, and confirmatory-test recommendations.
- Hugging Face symptom-to-diagnosis style datasets can be added through the same CSV schema below when internet access and dataset licenses are available.

## Local Training Schema

Prepare `ml/training_data/symptom_cases.csv` with:

```csv
symptoms,label
"fever headache rash low platelets",Dengue
"periodic fever chills sweating weakness",Malaria
```

For production, download the selected datasets with their original licenses, normalize symptom names, map target labels to the supported MEDISENSE fever illnesses, and run:

```powershell
cd ml
python train_model.py
```

The current checked-in FastAPI service trains a compact curated Scikit-learn model at startup and returns verified rule-based fallbacks for uncertain cases. This avoids fake predictions while keeping the app usable when Kaggle credentials or Hugging Face network access are not available.
