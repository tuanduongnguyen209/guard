import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return Math.round(amount || 0).toLocaleString('vi-VN') + ' ₫';
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const CATEGORIES = [
  'Food', 'Transport', 'Bills', 'Investing', 'Entertainment', 'Other'
];

export const CATEGORY_ICONS = {
  'Food': '🍔',
  'Transport': '🚗',
  'Bills': '📄',
  'Investing': '📈',
  'Entertainment': '🎬',
  'Other': '📦'
};
