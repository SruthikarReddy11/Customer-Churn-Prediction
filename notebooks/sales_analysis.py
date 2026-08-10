import pandas as pd

df = pd.read_csv("../data/Sales.csv.csv", encoding='latin1')

print(df.head())
print(df.shape)
print(df.columns)

print("\nMissing Values:")
print(df.isnull().sum())

print("\nDuplicate Rows:")
print(df.duplicated().sum())

print("\nData Types:")
print(df.dtypes)

df['Order Date'] = pd.to_datetime(df['Order Date'])
df['Ship Date'] = pd.to_datetime(df['Ship Date'])

print(df.dtypes)

df['Year'] = df['Order Date'].dt.year
df['Month'] = df['Order Date'].dt.month_name()
df['Month_Num'] = df['Order Date'].dt.month
df['Profit Margin'] = (df['Profit'] / df['Sales']) * 100

print("Total Sales:", df['Sales'].sum())
print("Total Profit:", df['Profit'].sum())
print("Total Orders:", df['Order ID'].nunique())
print("Total Customers:", df['Customer ID'].nunique())

top_products = df.groupby('Product Name')['Sales'].sum()

top_products = top_products.sort_values(ascending=False).head(10)

print(top_products)


region_sales = df.groupby('Region')['Sales'].sum()

print(region_sales)

category_sales = df.groupby('Category')['Sales'].sum()

print(category_sales)

df.to_csv("../data/cleaned_sales.csv", index=False)

print("Cleaned dataset saved!")

