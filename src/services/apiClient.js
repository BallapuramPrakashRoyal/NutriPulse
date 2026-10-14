/**
 * NutriPulse Pro — Frontend to Backend API Bridge
 * Automatically connects to Vercel Serverless Functions (/api/*) or Local FastAPI (http://localhost:8000)
 * © Ballapuram Prakash Royal. All Rights Reserved.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function calculateClinicalTargets(biometrics) {
  const res = await fetch(`${API_BASE}/tdee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(biometrics)
  });
  if (!res.ok) throw new Error('Failed to calculate TDEE from backend');
  return res.json();
}

export async function fetchFoodsFromBackend() {
  const res = await fetch(`${API_BASE}/foods`);
  if (!res.ok) throw new Error('Failed to fetch food database');
  return res.json();
}

export async function checkBackendHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
