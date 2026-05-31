# Computer Vision Training Pipeline (scaffold)

This document describes the CV training pipeline scaffold added to the repository. It is intentionally minimal and focused on developer velocity: a synthetic-data smoke-run, a small model, and clear next steps toward production training.

Files added:

- `src/services/cv/model.py` — `SimpleCNN` small model used for smoke runs.
- `src/services/cv/data_loader.py` — `SyntheticDataset` and `get_dataloader()` for fast synthetic data.
- `src/services/cv/train.py` — training CLI that runs N epochs over synthetic data.

Quickstart (from repo root):

```powershell
cd D:/PROJECT/RoadWatch-AI
.\venv\Scripts\python.exe src/services/cv/train.py --epochs 1 --batch-size 8 --batches 10
```

Next steps to productionize:

- Replace `SyntheticDataset` with real dataset loader (COCO, VOC or custom annotated dataset).
- Add augmentation pipeline (Albumentations / torchvision.transforms).
- Integrate with Label Studio / CVAT export and dataset versioning.
- Add Lightning or Accelerate for distributed training, mixed precision, and checkpointing.
- Add model export: TorchScript / ONNX and validation harness.
- Add CI smoke test that runs the synthetic smoke-run (fast) on PRs.
