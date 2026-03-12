"""
test_kim_dice.py  --  Phase 2 smoke test for DiCE + Kimi services
Run from:  cd server && python test_kim_dice.py
"""
import sys, traceback, os
sys.path.insert(0, '.')

# Load .env so NVIDIA_API_KEY is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass  # python-dotenv not installed; env vars must be set manually

# ---- DiCE ------------------------------------------------------------------
print("=== DICE ===")
try:
    # Canonical name
    from app.services.dice_service import load_dice_explainer
    load_dice_explainer()
    print("[OK]  DiCE  (load_dice_explainer)")
except Exception:
    traceback.print_exc()

try:
    # Alias name (used in some test scripts)
    from app.services.dice_service import load_dice_engine
    load_dice_engine()
    print("[OK]  DiCE alias  (load_dice_engine)")
except Exception:
    traceback.print_exc()

# ---- Kimi ------------------------------------------------------------------
print()
print("=== KIMI ===")
try:
    # Canonical name
    from app.services.kimi_service import get_intervention_recommendation
    print("[OK]  Kimi import  (get_intervention_recommendation)")
except Exception:
    traceback.print_exc()

try:
    # Alias name
    from app.services.kimi_service import get_intervention
    print("[OK]  Kimi alias   (get_intervention)")
except Exception:
    traceback.print_exc()

# API key check (service uses NVIDIA_API_KEY, not KIMI_API_KEY)
nvidia_key = os.getenv("NVIDIA_API_KEY", "")
kimi_key   = os.getenv("KIMI_API_KEY",   "")
print()
print("NVIDIA_API_KEY set : %s  (%d chars)" % (bool(nvidia_key), len(nvidia_key)))
print("KIMI_API_KEY set   : %s  (%d chars)" % (bool(kimi_key),   len(kimi_key)))

if nvidia_key and len(nvidia_key) > 10:
    print("[OK]  API key ready -- Kimi will use live NVIDIA inference")
else:
    print("[WARN] No NVIDIA_API_KEY found.  Kimi will use rule-based fallback.")
    print("       Add to server/.env:  NVIDIA_API_KEY=nvapi-...")
