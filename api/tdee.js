/**
 * Vercel Serverless Function: POST /api/tdee
 * Clinical Mifflin-St Jeor BMR, TDEE & Atwater Macro Split Engine
 * © Ballapuram Prakash Royal. All Rights Reserved.
 */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const {
    weight = 72,
    height = 175,
    age = 24,
    gender = 'male',
    activityMultiplier = 1.55,
    calOffset = 0,
    proteinPct = 30,
    carbsPct = 40,
    fatPct = 30
  } = req.body || {};

  const bmr = Math.round(
    10 * Number(weight) +
      6.25 * Number(height) -
      5 * Number(age) +
      (gender === 'male' ? 5 : -161)
  );
  const tdee = Math.round(bmr * Number(activityMultiplier));
  const targetCalories = Math.max(1200, tdee + Number(calOffset));

  res.status(200).json({
    bmr,
    tdee,
    targetCalories,
    macros: {
      proteinG: Math.round((targetCalories * (Number(proteinPct) / 100)) / 4),
      carbsG: Math.round((targetCalories * (Number(carbsPct) / 100)) / 4),
      fatG: Math.round((targetCalories * (Number(fatPct) / 100)) / 9),
      fiberG: Math.round((targetCalories / 1000) * 14)
    }
  });
}
