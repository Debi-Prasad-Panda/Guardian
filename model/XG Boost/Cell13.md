# Cell 13
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

X_train, X_calib, y_train, y_calib = train_test_split(
    X_train, y_train,
    test_size=0.15,
    random_state=42
)

print(f'✅ Data split complete!')
print(f'Train:       {len(X_train):>10,} rows')
print(f'Calibration: {len(X_calib):>10,} rows')
print(f'Test:        {len(X_test):>10,} rows')
print(f'\nTrain target rate: {y_train.mean():.2%}')
print(f'Test target rate:  {y_test.mean():.2%}')
