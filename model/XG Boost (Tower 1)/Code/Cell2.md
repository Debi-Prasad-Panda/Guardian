# Cell 2
# %%  ═══ CELL 2 — Explore Dataset File Paths ══════════════════════════════

# List all files to confirm exact paths before loading
for dirname, _, filenames in os.walk('/kaggle/input'):
    for filename in filenames:
        filepath = os.path.join(dirname, filename)
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f'{size_mb:8.2f} MB  {filepath}')