import sqlite3
from typing import List, Tuple
import os

DB_SCHEMA = '''
CREATE TABLE IF NOT EXISTS phashes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id TEXT,
  phash TEXT
);
'''


def init_db(db_path: str = 'phash_store.sqlite'):
    os.makedirs(os.path.dirname(db_path) or '.', exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute(DB_SCHEMA)
    conn.commit()
    conn.close()


def add_phash(phash: str, image_id: str = None, db_path: str = 'phash_store.sqlite') -> None:
    conn = sqlite3.connect(db_path)
    conn.execute('INSERT INTO phashes (image_id, phash) VALUES (?, ?)', (image_id, phash))
    conn.commit()
    conn.close()


def list_phashes(db_path: str = 'phash_store.sqlite') -> List[Tuple[int, str, str]]:
    conn = sqlite3.connect(db_path)
    cur = conn.execute('SELECT id, image_id, phash FROM phashes')
    rows = cur.fetchall()
    conn.close()
    return rows


def find_similar(phash: str, max_hamming: int = 8, db_path: str = 'phash_store.sqlite'):
    # load all and compute Hamming distances
    target = int(phash, 16)
    res = []
    for _id, image_id, p in list_phashes(db_path):
        try:
            v = int(p, 16)
            xor = target ^ v
            # hamming distance
            hd = xor.bit_count()
            if hd <= max_hamming:
                # convert to probability like
                prob = max(0.0, 1.0 - hd / 64.0)
                res.append({'id': _id, 'image_id': image_id, 'phash': p, 'hamming': hd, 'probability': prob})
        except Exception:
            continue
    return res
