// Shared Tailwind component patterns for consistent styling across the app
// This file provides TypeScript-friendly class combinations

export const buttonStyles = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'bg-secondary-200 hover:bg-secondary-300 text-secondary-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'text-primary-600 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

export const cardStyles = {
  base: 'bg-white rounded-xl shadow-soft p-6 border border-secondary-200',
  elevated: 'bg-white rounded-xl shadow-soft-lg p-6 border border-secondary-200',
  interactive: 'bg-white rounded-xl shadow-soft p-6 border border-secondary-200 hover:shadow-soft-lg transition-shadow duration-200 cursor-pointer',
} as const;

export const inputStyles = {
  base: 'w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200',
  error: 'w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200',
} as const;

export const textStyles = {
  heading: 'text-secondary-900 font-semibold',
  headingLarge: 'text-secondary-900 font-bold text-2xl',
  body: 'text-secondary-700 leading-relaxed',
  bodyLarge: 'text-secondary-700 leading-relaxed text-lg',
  caption: 'text-secondary-500 text-sm',
  error: 'text-red-600 text-sm',
} as const;

export const layoutStyles = {
  container: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12',
  grid: 'grid gap-6',
  gridTwo: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  gridThree: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
} as const;

export const spacingStyles = {
  section: 'py-8 sm:py-12',
  card: 'p-6',
  button: 'py-2 px-4',
  input: 'py-2 px-3',
} as const;

// Type definitions for better TypeScript support
export type ButtonVariant = keyof typeof buttonStyles;
export type CardVariant = keyof typeof cardStyles;
export type InputVariant = keyof typeof inputStyles;
export type TextVariant = keyof typeof textStyles;
