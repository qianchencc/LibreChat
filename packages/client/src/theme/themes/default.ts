import { IThemeRGB } from '../types';

/**
 * Default light theme
 * RGB values extracted from the existing CSS variables
 */
export const defaultTheme: IThemeRGB = {
  // Text colors
  'rgb-text-primary': '20 20 19',
  'rgb-text-secondary': '67 65 60',
  'rgb-text-secondary-alt': '82 79 73',
  'rgb-text-tertiary': '91 88 81',
  'rgb-text-warning': '133 76 0',
  'rgb-text-destructive': '164 49 28',

  // Link and accent colors
  'rgb-link': '148 62 38',
  'rgb-link-hover': '112 44 27',
  'rgb-link-visited': '117 65 133',
  'rgb-accent-primary': '148 62 38',
  'rgb-accent-primary-hover': '112 44 27',

  // Ring colors
  'rgb-ring-primary': '148 62 38',

  // Header colors
  'rgb-header-primary': '245 244 238',
  'rgb-header-hover': '229 225 215',
  'rgb-header-button-hover': '229 225 215',

  // Surface colors
  'rgb-surface-active': '224 219 207',
  'rgb-surface-active-alt': '215 209 196',
  'rgb-surface-hover': '229 225 215',
  'rgb-surface-hover-alt': '218 212 199',
  'rgb-surface-composer-hover': '229 225 215',
  'rgb-surface-primary': '245 244 238',
  'rgb-surface-primary-alt': '241 239 232',
  'rgb-surface-primary-contrast': '233 230 220',
  'rgb-surface-secondary': '237 234 225',
  'rgb-surface-secondary-alt': '224 219 207',
  'rgb-surface-tertiary': '229 225 215',
  'rgb-surface-tertiary-alt': '250 249 245',
  'rgb-surface-dialog': '250 249 245',
  'rgb-surface-overlay': '20 20 19',
  'rgb-surface-submit': '218 119 86',
  'rgb-surface-submit-hover': '190 89 58',
  'rgb-surface-destructive': '255 95 56',
  'rgb-surface-destructive-hover': '224 70 36',
  'rgb-surface-chat': '245 244 238',
  'rgb-surface-inverted': '20 20 19',
  'rgb-surface-inverted-hover': '52 51 48',
  'rgb-text-inverted': '249 249 247',
  'rgb-surface-fixed': '255 255 255', // #fff (white) — same in light + dark
  'rgb-surface-fixed-hover': '236 236 236', // #ececec (gray-100) — same in light + dark
  'rgb-text-fixed': '33 33 33', // #212121 (gray-800) — same in light + dark

  // Border colors
  'rgb-border-light': '215 209 196',
  'rgb-border-medium': '188 181 167',
  'rgb-border-medium-alt': '188 181 167',
  'rgb-border-heavy': '143 136 124',
  'rgb-border-xheavy': '91 88 81',
  'rgb-border-destructive': '164 49 28',

  // Status colors
  'rgb-status-success': '0 105 49',
  'rgb-status-success-subtle': '226 246 232',
  'rgb-status-success-border': '91 191 122',
  'rgb-status-success-strong': '0 200 83',
  'rgb-status-info': '48 91 137',
  'rgb-status-info-subtle': '231 240 249',
  'rgb-status-info-border': '136 176 218',
  'rgb-status-info-strong': '115 159 207',
  'rgb-status-warning': '133 76 0',
  'rgb-status-warning-subtle': '250 239 213',
  'rgb-status-warning-border': '218 168 80',
  'rgb-status-warning-strong': '232 171 54',
  'rgb-status-error': '164 49 28',
  'rgb-status-error-subtle': '252 232 225',
  'rgb-status-error-border': '235 142 112',
  'rgb-status-error-strong': '255 95 56',
  'rgb-status-neutral': '67 65 60',
  'rgb-status-neutral-subtle': '233 230 220',
  'rgb-status-neutral-border': '188 181 167',
  'rgb-text-on-status': '20 20 19',

  // Brand colors
  'rgb-brand-purple': '148 62 38',

  /** Categorical series scale. Steps clear 3:1 against BOTH the popover surface
   *  and the #ececec meter track, with worst adjacent CVD ΔE 12.4 and worst
   *  adjacent normal-vision ΔE 19.0. Slot order is the CVD-safety mechanism. */
  'rgb-series-1': '5 110 189', // #056ebd (cerulean)
  'rgb-series-2': '210 70 5',
  'rgb-series-3': '0 130 124',
  'rgb-series-4': '160 105 0',
  'rgb-series-5': '190 65 115',
  'rgb-series-6': '126 35 205', // #7e23cd (violet)
  'rgb-series-7': '1 131 1', // #018301 (green)

  // Presentation
  'rgb-presentation': '245 244 238',
};
