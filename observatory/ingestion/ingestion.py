"""Stage 1: load and prepare the official UCI German Credit dataset."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

DATASET_COLUMNS = [
    "checking_status",
    "duration_months",
    "credit_history",
    "purpose",
    "credit_amount",
    "savings",
    "employment",
    "installment_rate",
    "personal_status_sex",
    "other_debtors",
    "residence_since",
    "property",
    "age",
    "other_installment_plans",
    "housing",
    "existing_credits",
    "job",
    "dependents",
    "telephone",
    "foreign_worker",
    "credit_risk",
]

COMPOUND_FIELD = "personal_status_sex"
GENDER_COL = "gender"
MARITAL_COL = "marital_status"
AGE_COL = "age"
FOREIGN_COL = "foreign_worker"
TARGET_COL = "credit_risk"
TARGET_BINARY = "target"

GENDER_MAP = {
    "A91": "male",
    "A92": "female",
    "A93": "male",
    "A94": "male",
    "A95": "female",
}
MARITAL_MAP = {
    "A91": "divorced_separated",
    "A92": "divorced_separated_married",
    "A93": "single",
    "A94": "married_widowed",
    "A95": "single",
}


def load_dataset(*, dataset_path: str | Path) -> pd.DataFrame:
    """Load the raw official whitespace-delimited dataset and validate it."""
    path = Path(dataset_path)
    if not path.is_file():
        raise FileNotFoundError(
            f"dataset not found: {path}; run scripts/download_uci_german_credit.py"
        )

    dataframe = pd.read_csv(path, sep=r"\s+", names=DATASET_COLUMNS)
    if dataframe.shape != (1000, 21):
        raise ValueError(
            f"expected official dataset shape (1000, 21), received {dataframe.shape}"
        )
    if dataframe.isna().any().any():
        raise ValueError("dataset contains missing values")
    if set(dataframe[TARGET_COL].unique()) != {1, 2}:
        raise ValueError("credit_risk must contain exactly the official classes 1 and 2")
    return dataframe


def decompose_compound_field(*, dataframe: pd.DataFrame) -> pd.DataFrame:
    """Split the official compound personal-status/sex code into audit columns."""
    unexpected = set(dataframe[COMPOUND_FIELD].unique()) - set(GENDER_MAP)
    if unexpected:
        raise ValueError(f"unexpected {COMPOUND_FIELD} codes: {sorted(unexpected)}")

    result = dataframe.copy()
    result[GENDER_COL] = result[COMPOUND_FIELD].map(GENDER_MAP)
    result[MARITAL_COL] = result[COMPOUND_FIELD].map(MARITAL_MAP)
    result[TARGET_BINARY] = (result[TARGET_COL] == 1).astype(int)
    return result


def load_and_prepare(
    *,
    dataset_path: str | Path,
    test_size: float = 0.30,
    random_state: int = 42,
) -> dict:
    """Return encoded model matrices plus unencoded rows for fairness checks."""
    if not 0 < test_size < 1:
        raise ValueError("test_size must be between 0 and 1")

    dataframe = decompose_compound_field(
        dataframe=load_dataset(dataset_path=dataset_path)
    )
    train_index, test_index = train_test_split(
        dataframe.index,
        test_size=test_size,
        random_state=random_state,
        stratify=dataframe[TARGET_BINARY],
    )
    dataframe_train = dataframe.loc[train_index].reset_index(drop=True)
    dataframe_test = dataframe.loc[test_index].reset_index(drop=True)

    # Protected information, including the original compound field, is excluded.
    excluded = {
        TARGET_COL,
        TARGET_BINARY,
        COMPOUND_FIELD,
        GENDER_COL,
        MARITAL_COL,
        AGE_COL,
        FOREIGN_COL,
    }
    feature_columns = [column for column in dataframe.columns if column not in excluded]
    categorical_columns = [
        column
        for column in feature_columns
        if dataframe_train[column].dtype == "object"
    ]
    numeric_columns = [
        column for column in feature_columns if column not in categorical_columns
    ]

    encoder = OneHotEncoder(
        handle_unknown="error",
        sparse_output=False,
        feature_name_combiner="concat",
    )
    encoded_train = encoder.fit_transform(dataframe_train[categorical_columns])
    encoded_test = encoder.transform(dataframe_test[categorical_columns])
    encoded_names = encoder.get_feature_names_out(categorical_columns).tolist()

    X_train = pd.DataFrame(encoded_train, columns=encoded_names)
    X_test = pd.DataFrame(encoded_test, columns=encoded_names)
    for column in numeric_columns:
        X_train[column] = dataframe_train[column].to_numpy()
        X_test[column] = dataframe_test[column].to_numpy()

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": dataframe_train[TARGET_BINARY].copy(),
        "y_test": dataframe_test[TARGET_BINARY].copy(),
        "df_train": dataframe_train,
        "df_test": dataframe_test,
        "feature_columns": X_train.columns.tolist(),
        "encoder": encoder,
        "meta": {
            "rows": int(len(dataframe)),
            "train_rows": int(len(dataframe_train)),
            "test_rows": int(len(dataframe_test)),
            "encoded_features": int(X_train.shape[1]),
            "protected_columns_excluded": sorted(excluded - {TARGET_COL, TARGET_BINARY}),
            "gender_counts": {
                key: int(value)
                for key, value in dataframe[GENDER_COL].value_counts().items()
            },
        },
    }
