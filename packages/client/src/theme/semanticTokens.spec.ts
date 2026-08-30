import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { IThemeRGB } from './types';
import { createTailwindColors } from './utils/createTailwindColors';
import { defaultTheme } from './themes/default';
import { darkTheme } from './themes/dark';

const sharedComponents = [
  'AnimatedSearchInput.tsx',
  'AlertDialog.tsx',
  'Button.tsx',
  'Chip.tsx',
  'SegmentedMeter.tsx',
  'Dialog.tsx',
  'DialogTemplate.tsx',
  'IconButton.tsx',
  'OGDialogTemplate.tsx',
  'OriginalDialog.tsx',
  'Tag.tsx',
  'Toast.tsx',
];

const sharedDialogComponents = [
  'AlertDialog.tsx',
  'Dialog.tsx',
  'DialogTemplate.tsx',
  'OGDialogTemplate.tsx',
  'OriginalDialog.tsx',
];

describe('shared component color guardrail', () => {
  it('keeps shared primitives free of direct palette utilities and hex colors', () => {
    const directPalette =
      /(?:bg|text|border|ring|from|via|to)-(?:gray|red|green|blue|purple|amber|yellow|orange|pink|indigo|violet|teal|cyan|slate|zinc|neutral|stone)-\d/;
    const hexColor = /#[0-9a-f]{3,8}\b/i;

    sharedComponents.forEach((component) => {
      const source = readFileSync(join(__dirname, '..', 'components', component), 'utf8');

      expect(source).not.toMatch(directPalette);
      expect(source).not.toMatch(hexColor);
    });
  });

  it('keeps every shared dialog shell on the semantic dialog surface', () => {
    sharedDialogComponents.forEach((component) => {
      const source = readFileSync(join(__dirname, '..', 'components', component), 'utf8');

      expect(source).toMatch(/\bbg-surface-dialog\b/);
    });
  });
});

describe('dark dialog surface', () => {
  it('matches the bundled ChenChat background in CSS and the runtime theme', () => {
    const appStyles = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'client', 'src', 'style.css'),
      'utf8',
    );

    expect(appStyles).toMatch(/--surface-dialog:\s*52 52 49;/);
    expect(darkTheme['rgb-surface-dialog']).toBe('52 52 49');
  });
});

describe('dark hover surface', () => {
  it('uses the raised ChenChat surface in both CSS and the runtime theme', () => {
    const appStyles = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'client', 'src', 'style.css'),
      'utf8',
    );

    expect(appStyles).toMatch(/--surface-hover:\s*70 69 65;/);
    expect(darkTheme['rgb-surface-hover']).toBe('70 69 65');
  });
});

describe('composer hover surface', () => {
  it('uses the mode-specific raised surface', () => {
    const appStyles = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'client', 'src', 'style.css'),
      'utf8',
    );

    expect(appStyles).toMatch(/--surface-composer-hover:\s*229 225 215;/);
    expect(appStyles).toMatch(/--surface-composer-hover:\s*70 69 65;/);
    expect(defaultTheme['rgb-surface-composer-hover']).toBe('229 225 215');
    expect(darkTheme['rgb-surface-composer-hover']).toBe('70 69 65');
  });
});

describe('dark destructive text', () => {
  it('keeps destructive text and status error readable on their intended surfaces', () => {
    const appStyles = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'client', 'src', 'style.css'),
      'utf8',
    );

    expect(appStyles).toMatch(/--text-destructive:\s*255 136 105;/);
    expect(darkTheme['rgb-text-destructive']).toBe('255 136 105');
    expect(darkTheme['rgb-status-error']).toBe('255 126 94');
  });
});

describe('light brand text', () => {
  it('uses the contrasting accent derivative in the default theme', () => {
    expect(defaultTheme['rgb-brand-purple']).toBe('148 62 38');
  });
});

describe('shared field and dropdown interaction styles', () => {
  it('keeps pointer focus stable and keyboard focus visible on text fields', () => {
    /** The focus treatment lives in the shared field module, so guard it there and
     *  assert the primitives still compose it rather than restating the classes. */
    const field = readFileSync(join(__dirname, '..', 'components', 'Field.ts'), 'utf8');

    expect(field).toMatch(/focus-visible:border-border-medium/);
    expect(field).toMatch(/focus-visible:ring-2/);
    expect(field).toMatch(/focus-visible:ring-text-primary/);

    const composers: Array<[string, RegExp]> = [
      ['Input.tsx', /\bfieldControl\b/],
      ['Textarea.tsx', /\bfieldBase\b/],
      ['Dropdown.tsx', /\bfieldControl\b/],
      ['ControlCombobox.tsx', /\bfieldControl\b/],
    ];
    composers.forEach(([component, token]) => {
      const source = readFileSync(join(__dirname, '..', 'components', component), 'utf8');
      expect(source).toMatch(token);
    });

    const secretInput = readFileSync(
      join(__dirname, '..', 'components', 'SecretInput.tsx'),
      'utf8',
    );
    expect(secretInput).not.toMatch(/(?:hover|focus-visible):border-/);

    const appStyles = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'client', 'src', 'style.css'),
      'utf8',
    );
    expect(appStyles).toMatch(/html\[data-input-modality='pointer'\]/);
    expect(appStyles).toMatch(/html\[data-input-modality='keyboard'\]/);
    expect(appStyles).toMatch(/outline:\s*2px solid rgb\(var\(--text-primary\)\) !important;/);
    expect(appStyles).not.toMatch(/textarea\s*\n\):hover,/);
  });

  it('keeps shared dropdown triggers transparent at rest and while disabled', () => {
    const source = readFileSync(join(__dirname, '..', 'components', 'Dropdown.tsx'), 'utf8');

    expect(source).toMatch(/\bbg-transparent\b/);
    expect(source).toMatch(/\bdisabled:hover:bg-transparent\b/);
    expect(source).not.toMatch(/\bbg-surface-primary\b/);
  });
});

type Rgb = [number, number, number];

/** Surfaces that carry body copy; `surface-tertiary` is chip/input fill, added per-group below. */
const canvasSurfaces: Array<keyof IThemeRGB> = [
  'rgb-surface-primary',
  'rgb-surface-primary-alt',
  'rgb-surface-secondary',
  'rgb-surface-dialog',
  'rgb-surface-chat',
  'rgb-presentation',
];

const neutralTextTokens: Array<keyof IThemeRGB> = [
  'rgb-text-primary',
  'rgb-text-secondary',
  'rgb-text-secondary-alt',
  'rgb-text-tertiary',
];

const statusTextTokens: Array<keyof IThemeRGB> = ['rgb-text-warning', 'rgb-text-destructive'];

/** How Alert/Badge/Tag/Chip paint every status variant: `text-status-x` on `bg-status-x-subtle`. */
const statusHues = ['success', 'info', 'warning', 'error', 'neutral'] as const;
const strongStatusSurfaces: Array<keyof IThemeRGB> = [
  'rgb-surface-submit',
  'rgb-surface-destructive',
  'rgb-status-success-strong',
  'rgb-status-info-strong',
  'rgb-status-warning-strong',
  'rgb-status-error-strong',
];

const WCAG_AA_NORMAL = 4.5;

describe('ChenChat bundled identity', () => {
  it('publishes the approved light and dark anchors through runtime and CSS defaults', () => {
    const appStyles = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'client', 'src', 'style.css'),
      'utf8',
    );
    const anchors: Array<[keyof IThemeRGB, string, string]> = [
      ['rgb-surface-primary', '245 244 238', '45 45 43'],
      ['rgb-text-primary', '20 20 19', '249 249 247'],
      ['rgb-surface-submit', '218 119 86', '204 125 94'],
    ];

    anchors.forEach(([token, light, dark]) => {
      expect(defaultTheme[token]).toBe(light);
      expect(darkTheme[token]).toBe(dark);

      const property = token.slice(4);
      const declared = [...appStyles.matchAll(new RegExp(`--${property}:\\s*([^;]+);`, 'g'))].map(
        (match) => match[1].trim(),
      );
      expect(declared.slice(0, 2)).toEqual([light, dark]);
    });
  });
});

function toRgb(theme: IThemeRGB, token: keyof IThemeRGB): Rgb {
  const parts = theme[token]?.trim().split(/\s+/).map(Number);
  if (parts?.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`theme token "${token}" is not an "R G B" triplet`);
  }
  return [parts[0], parts[1], parts[2]];
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function belowAA(
  theme: IThemeRGB,
  textTokens: Array<keyof IThemeRGB>,
  surfaces: Array<keyof IThemeRGB>,
): string[] {
  return textTokens.flatMap((text) =>
    surfaces.flatMap((surface) => {
      const ratio = contrast(toRgb(theme, text), toRgb(theme, surface));
      return ratio < WCAG_AA_NORMAL ? [`${text} on ${surface}: ${ratio.toFixed(2)}:1`] : [];
    }),
  );
}

describe.each([
  ['default', defaultTheme],
  ['dark', darkTheme],
])('%s theme text contrast', (_name, theme: IThemeRGB) => {
  it('keeps neutral text at WCAG AA on every surface it renders on', () => {
    expect(belowAA(theme, neutralTextTokens, [...canvasSurfaces, 'rgb-surface-tertiary'])).toEqual(
      [],
    );
  });

  it('keeps warning and destructive text at WCAG AA on canvas surfaces', () => {
    expect(belowAA(theme, statusTextTokens, canvasSurfaces)).toEqual([]);
  });

  it('keeps links and text accents at WCAG AA on canvas surfaces', () => {
    expect(
      belowAA(
        theme,
        [
          'rgb-link',
          'rgb-link-hover',
          'rgb-link-visited',
          'rgb-accent-primary',
          'rgb-accent-primary-hover',
          'rgb-brand-purple',
        ],
        canvasSurfaces,
      ),
    ).toEqual([]);
  });

  it('keeps every status hue at WCAG AA against its own subtle fill', () => {
    const failures = statusHues.flatMap((hue) =>
      belowAA(
        theme,
        [`rgb-status-${hue}` as keyof IThemeRGB],
        [`rgb-status-${hue}-subtle` as keyof IThemeRGB],
      ),
    );
    expect(failures).toEqual([]);
  });

  it('keeps labels at WCAG AA on strong action and status surfaces', () => {
    expect(belowAA(theme, ['rgb-text-on-status'], strongStatusSurfaces)).toEqual([]);
  });
});

/** The meter paints segments on `surface-tertiary`; the swatch and popover chrome
 *  sit on `surface-secondary`. Both have to clear the 3:1 mark-contrast floor. */
const seriesTokens = Array.from(
  { length: 7 },
  (_, index) => `rgb-series-${index + 1}` as keyof IThemeRGB,
);
const seriesSurfaces: Array<keyof IThemeRGB> = ['rgb-surface-tertiary', 'rgb-surface-secondary'];
const WCAG_MARK_MIN = 3;

describe('categorical series scale', () => {
  it('defines every slot in both modes as an "R G B" triplet', () => {
    seriesTokens.forEach((token) => {
      expect(() => toRgb(defaultTheme, token)).not.toThrow();
      expect(() => toRgb(darkTheme, token)).not.toThrow();
    });
  });

  it('never reuses a reserved status colour for series identity', () => {
    const reserved = new Set(
      statusHues.flatMap((hue) => [
        defaultTheme[`rgb-status-${hue}` as keyof IThemeRGB],
        darkTheme[`rgb-status-${hue}` as keyof IThemeRGB],
      ]),
    );

    seriesTokens.forEach((token) => {
      expect(reserved.has(defaultTheme[token])).toBe(false);
      expect(reserved.has(darkTheme[token])).toBe(false);
    });
  });

  it('keeps the app CSS defaults in step with the runtime themes', () => {
    const appStyles = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'client', 'src', 'style.css'),
      'utf8',
    );

    seriesTokens.forEach((token) => {
      const property = token.slice(4);
      const declared = [...appStyles.matchAll(new RegExp(`--${property}:\\s*([^;]+);`, 'g'))].map(
        (match) => match[1].trim(),
      );

      /** One declaration for `html`, one for `.dark` — and both must match. */
      expect(declared).toEqual([defaultTheme[token], darkTheme[token]]);
    });
  });

  it('exposes each slot as a Tailwind utility backed by its CSS variable', () => {
    const colors = createTailwindColors();

    seriesTokens.forEach((token) => {
      const property = token.slice(4);
      expect(colors[property]).toBe(`rgb(var(--${property}) / <alpha-value>)`);
    });
  });
});

describe.each([
  ['default', defaultTheme],
  ['dark', darkTheme],
])('%s series contrast', (_name, theme: IThemeRGB) => {
  it('keeps every series slot at the 3:1 mark floor on the track and the panel', () => {
    const failures = seriesTokens.flatMap((token) =>
      seriesSurfaces.flatMap((surface) => {
        const ratio = contrast(toRgb(theme, token), toRgb(theme, surface));
        return ratio < WCAG_MARK_MIN ? [`${token} on ${surface}: ${ratio.toFixed(2)}:1`] : [];
      }),
    );

    expect(failures).toEqual([]);
  });
});
