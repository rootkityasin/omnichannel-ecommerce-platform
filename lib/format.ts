interface QuantitySettings {
  measurementUnit?: string | null;
  weightUnitValue?: number | null;
}

export function formatQuantity(
  quantity: number,
  settings: QuantitySettings | null | undefined,
  customWeight?: number,
): string {
  if (!settings) return quantity.toString();

  // Default to quantity if PCS or unknown
  const unit = settings.measurementUnit?.toUpperCase() || "PCS";
  if (unit !== "WEIGHT") {
    return quantity.toString();
  }

  // Weight Logic
  const unitValue = customWeight || settings.weightUnitValue || 200; // Default 200g
  const totalGrams = quantity * unitValue;

  if (totalGrams >= 1000) {
    // If exact integer kg, show without decimal places, e.g. 1 kg instead of 1.0 kg
    const kg = totalGrams / 1000;
    return kg % 1 === 0 ? `${kg} kg` : `${kg.toFixed(1)} kg`;
  }
  return `${totalGrams} g`;
}
