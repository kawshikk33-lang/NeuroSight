import numpy as np
import pandas as pd


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    working = df.copy()
    working = working.loc[:, ~working.columns.duplicated()]
    working = working.drop_duplicates()

    if "revenue" in working.columns:
        lower = working["revenue"].quantile(0.01)
        upper = working["revenue"].quantile(0.99)
        working["revenue"] = working["revenue"].clip(lower=lower, upper=upper)
    if "quantity" in working.columns:
        working["quantity"] = working["quantity"].clip(lower=0)
    if "recency" in working.columns:
        working["recency"] = working["recency"].ffill()

    num_cols = working.select_dtypes(include=[np.number]).columns
    cat_cols = [c for c in working.columns if c not in num_cols]
    for col in num_cols:
        working[col] = working[col].fillna(working[col].median())
    for col in cat_cols:
        mode = working[col].mode()
        fill = mode.iloc[0] if not mode.empty else "unknown"
        working[col] = working[col].fillna(fill)

    if "price" in working.columns and "quantity" in working.columns and "revenue" not in working.columns:
        working["revenue"] = working["price"] * working["quantity"]
    return working


def add_time_features(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    working = df.copy()
    if date_col not in working.columns:
        return working
    working[date_col] = pd.to_datetime(working[date_col], errors="coerce")
    working = working.sort_values(date_col)
    working["month"] = working[date_col].dt.month
    working["quarter"] = working[date_col].dt.quarter
    working["seasonality"] = np.sin(2 * np.pi * working["month"] / 12.0)
    for lag in (1, 3, 12):
        if "revenue" in working.columns:
            working[f"revenue_lag_{lag}"] = working["revenue"].shift(lag)
    if "revenue" in working.columns:
        working["revenue_roll_3"] = working["revenue"].shift(1).rolling(3).mean()
    return working
