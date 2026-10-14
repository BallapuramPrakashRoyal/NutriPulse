/**
 * NutriPulse Pro — Clinical Atwater & Mifflin-St Jeor Constants
 * © Ballapuram Prakash Royal. All Rights Reserved.
 */
export const ATWATER_FACTORS = {
  PROTEIN_KCAL_PER_G: 4,
  CARBS_KCAL_PER_G: 4,
  FAT_KCAL_PER_G: 9,
  FIBER_G_PER_1000_KCAL: 14
};

export const calcFoodCalories = (p, c, f) => Math.round((p * 4) + (c * 4) + (f * 9));
