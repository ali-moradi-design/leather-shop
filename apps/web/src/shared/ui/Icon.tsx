import type { SVGProps } from 'react';

const paths = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bag: <><path d="M4 9h16l-1.5 11h-13z" /><path d="M8 9a4 4 0 0 1 8 0" /></>,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  check: <path d="m5 12 5 5 9-10" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  filter: <path d="M4 7h10m4 0h2M4 17h4m4 0h8M16 5v4M10 15v4" />,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></>,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />,
  pinterest: <><circle cx="12" cy="12" r="8.5" /><path d="M10.5 20 12.5 11.5M10.4 14.3c3.6 1.3 6.1-1 6.1-3.8 0-2.6-2.2-4.5-4.6-4.5-3 0-4.9 2-4.9 4.3 0 1 .4 1.9 1.1 2.3" /></>,
  youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></>,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
