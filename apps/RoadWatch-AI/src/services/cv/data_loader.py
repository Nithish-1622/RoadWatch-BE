import torch
from torch.utils.data import Dataset, DataLoader
from typing import Tuple


class SyntheticDataset(Dataset):
    """A tiny synthetic dataset for quick smoke training runs.

    Returns random images and random labels. Useful for CI smoke tests
    and development when real data is not yet available.
    """

    def __init__(self, num_samples: int = 200, num_classes: int = 2, img_size: Tuple[int, int, int] = (3, 64, 64)):
        self.num_samples = num_samples
        self.num_classes = num_classes
        self.img_size = img_size

    def __len__(self) -> int:
        return self.num_samples

    def __getitem__(self, idx: int):
        img = torch.randn(self.img_size, dtype=torch.float32)
        label = torch.randint(0, self.num_classes, (1,)).item()
        return img, label


def get_dataloader(batch_size: int = 8, num_samples: int = 200, num_workers: int = 0, num_classes: int = 2):
    ds = SyntheticDataset(num_samples=num_samples, num_classes=num_classes)
    return DataLoader(ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
