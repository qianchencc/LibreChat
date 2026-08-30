import chenchatDark from '~/assets/chenchat-dark.png';
import chenchat from '~/assets/chenchat.png';
import { cn, DEFAULT_APP_TITLE } from '~/utils';

export default function BrandWordmark({
  appTitle,
  label = appTitle,
  className,
}: {
  appTitle: string;
  label?: string;
  className?: string;
}) {
  const classes = cn('inline-flex items-center', className);

  if (appTitle !== DEFAULT_APP_TITLE) {
    return <span className={classes}>{appTitle}</span>;
  }

  return (
    <span role="img" aria-label={label} className={classes}>
      <img src={chenchat} alt="" aria-hidden="true" className="h-full w-auto dark:hidden" />
      <img
        src={chenchatDark}
        alt=""
        aria-hidden="true"
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}
