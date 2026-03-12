import sys, traceback
sys.path.insert(0, '.')

print('=== DICE ===')
try:
    from app.services.dice_service import load_dice_explainer
    load_dice_explainer()
    print('DiCE OK')
except:
    traceback.print_exc()

print()
print('=== KIMI ===')
try:
    from app.services.kimi_service import get_intervention_recommendation
    print('Kimi import OK')
    import os
    print(f'KIMI_API_KEY set: {bool(os.getenv("KIMI_API_KEY", ""))}')
    print(f'Key length: {len(os.getenv("KIMI_API_KEY", ""))} chars')
except:
    traceback.print_exc()
