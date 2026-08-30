import { IThemeRGB } from '../types';

/**
 * Dark theme
 * RGB values extracted from the existing dark mode CSS variables
 */
export const darkTheme: IThemeRGB = {
  // Text colors
  'rgb-text-primary': '249 249 247',
  'rgb-text-secondary': '218 216 210',
  'rgb-text-secondary-alt': '195 192 184',
  'rgb-text-tertiary': '184 181 172',
  'rgb-text-warning': '245 186 83',
  'rgb-text-destructive': '255 136 105',

  // Link and accent colors
  'rgb-link': '232 165 140',
  'rgb-link-hover': '246 193 174',
  'rgb-link-visited': '211 170 224',
  'rgb-accent-primary': '229 155 125',
  'rgb-accent-primary-hover': '246 193 174',

  // Ring colors (not defined in dark mode, using default)
  'rgb-ring-primary': '229 155 125',

  // Header colors
  'rgb-header-primary': '45 45 43',
  'rgb-header-hover': '63 62 59',
  'rgb-header-button-hover': '63 62 59',

  // Surface colors
  'rgb-surface-active': '78 77 72',
  'rgb-surface-active-alt': '88 86 80',
  'rgb-surface-hover': '70 69 65',
  'rgb-surface-hover-alt': '82 80 75',
  'rgb-surface-composer-hover': '70 69 65',
  'rgb-surface-primary': '45 45 43',
  'rgb-surface-primary-alt': '52 52 49',
  'rgb-surface-primary-contrast': '58 58 55',
  'rgb-surface-secondary': '58 58 55',
  'rgb-surface-secondary-alt': '65 64 60',
  'rgb-surface-tertiary': '70 69 65',
  'rgb-surface-tertiary-alt': '78 77 72',
  'rgb-surface-dialog': '52 52 49',
  'rgb-surface-overlay': '0 0 0', // #000 (black)
  'rgb-surface-submit': '204 125 94',
  'rgb-surface-submit-hover': '229 155 125',
  'rgb-surface-destructive': '255 95 56',
  'rgb-surface-destructive-hover': '255 124 94',
  'rgb-surface-chat': '45 45 43',
  'rgb-surface-inverted': '249 249 247',
  'rgb-surface-inverted-hover': '223 221 214',
  'rgb-text-inverted': '20 20 19',
  'rgb-surface-fixed': '255 255 255', // #fff (white) — same in light + dark
  'rgb-surface-fixed-hover': '236 236 236', // #ececec (gray-100) — same in light + dark
  'rgb-text-fixed': '33 33 33', // #212121 (gray-800) — same in light + dark

  // Border colors
  'rgb-border-light': '78 77 72',
  'rgb-border-medium': '104 102 96',
  'rgb-border-medium-alt': '104 102 96',
  'rgb-border-heavy': '135 132 124',
  'rgb-border-xheavy': '179 176 167',
  'rgb-border-destructive': '255 95 56',

  // Status colors
  'rgb-status-success': '0 200 83',
  'rgb-status-success-subtle': '25 58 37',
  'rgb-status-success-border': '0 142 63',
  'rgb-status-success-strong': '0 200 83',
  'rgb-status-info': '143 190 231',
  'rgb-status-info-subtle': '30 50 68',
  'rgb-status-info-border': '73 119 160',
  'rgb-status-info-strong': '143 190 231',
  'rgb-status-warning': '245 186 83',
  'rgb-status-warning-subtle': '67 49 24',
  'rgb-status-warning-border': '154 110 39',
  'rgb-status-warning-strong': '245 186 83',
  'rgb-status-error': '255 126 94',
  'rgb-status-error-subtle': '75 37 28',
  'rgb-status-error-border': '181 68 43',
  'rgb-status-error-strong': '255 95 56',
  'rgb-status-neutral': '218 216 210',
  'rgb-status-neutral-subtle': '58 58 55',
  'rgb-status-neutral-border': '104 102 96',
  'rgb-text-on-status': '20 20 19',

  // Brand colors
  'rgb-brand-purple': '229 155 125',

  /** Categorical series scale — the same seven hues stepped for the dark
   *  surfaces: worst adjacent CVD ΔE 13.0, normal-vision ΔE 19.0, all ≥ 3:1. */
  'rgb-series-1': '55 162 248',
  'rgb-series-2': '242 116 65',
  'rgb-series-3': '24 185 176',
  'rgb-series-4': '200 133 12', // #c8850c (amber)
  'rgb-series-5': '240 112 154',
  'rgb-series-6': '194 134 255',
  'rgb-series-7': '80 167 49', // #50a731 (green)

  // Presentation
  'rgb-presentation': '45 45 43',
};
