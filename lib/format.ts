interface QuantitySettings {
  measurementUnit?: string | null;
  weightUnitValue?: number | null;
}

export function formatQuantity(
  quantity: number,
  settings: QuantitySettings | null | undefined,
): string {
  if (!settings) return quantity.toString();

  // Default to quantity if PCS or unknown
  const unit = settings.measurementUnit?.toUpperCase() || "PCS";
  if (unit !== "WEIGHT") {
    return quantity.toString();
  }

  // Weight Logic
  const unitValue = settings.weightUnitValue || 200; // Default 200g
  const totalGrams = quantity * unitValue;

  if (totalGrams >= 1000) {
    return `${(totalGrams / 1000).toFixed(1)} kg`;
  }
  return `${totalGrams} g`;
}
