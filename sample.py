import pandas as pd

# Load CSV and parse Timestamp
df = pd.read_csv(r"backend-dotnet\IntelliInspect.Backend\UploadedFiles\latest.csv", parse_dates=["Timestamp"])

# Create a column with only the date part
df["date_only"] = df["Timestamp"].dt.date

# Define simulation date range
sim_start = pd.to_datetime("2021-01-03").date()
sim_end = pd.to_datetime("2021-01-03").date()

# Filter rows in that range
filtered = df[(df["date_only"] >= sim_start) & (df["date_only"] <= sim_end)]

# Output count
print(f"Matched rows: {len(filtered)}")
print(filtered[["Timestamp", "Response"]].head())
