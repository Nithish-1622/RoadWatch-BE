import argparse
import time
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Any

from services.cv.model import SimpleCNN
from services.cv.data_loader import get_dataloader


def train_one_epoch(model: nn.Module, loader, optimizer, criterion, device: Any) -> float:
    model.train()
    total_loss = 0.0
    steps = 0
    for X, y in loader:
        X = X.to(device)
        y = y.to(device)
        optimizer.zero_grad()
        logits = model(X)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        steps += 1
    return total_loss / max(1, steps)


def run_training(epochs: int = 1, batch_size: int = 8, batches: int = 10, lr: float = 1e-3, device: str | None = None):
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    num_samples = batch_size * batches
    loader = get_dataloader(batch_size=batch_size, num_samples=num_samples)

    model = SimpleCNN(in_channels=3, num_classes=2).to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        loss = train_one_epoch(model, loader, optimizer, criterion, device)
        dt = time.time() - t0
        print(f"Epoch {epoch}/{epochs} - loss={loss:.4f} - time={dt:.2f}s")


def parse_args():
    p = argparse.ArgumentParser("cv-train")
    p.add_argument("--epochs", type=int, default=1)
    p.add_argument("--batch-size", type=int, default=8)
    p.add_argument("--batches", type=int, default=10, help="number of batches to run (synthetic)")
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--device", type=str, default=None)
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_training(epochs=args.epochs, batch_size=args.batch_size, batches=args.batches, lr=args.lr, device=args.device)
