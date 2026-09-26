import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const HELP_TYPES = [
  { value: 'debugging', label: 'Debugging' },
  { value: 'concept', label: 'Concept Clarification' },
  { value: 'design_review', label: 'Design Review' },
  { value: 'code_review', label: 'Code Review' },
];

export const URGENCY_LEVELS = [
  { value: 'high', label: 'High — deadline near' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function helpTypeLabel(value) {
  return HELP_TYPES.find((h) => h.value === value)?.label || value;
}

export function urgencyLabel(value) {
  return URGENCY_LEVELS.find((u) => u.value === value)?.label.split(' — ')[0] || value;
}
