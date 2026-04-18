import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  /** Optional max-width override — some screens need wider canvas */
  maxWidth?: 'narrow' | 'content' | 'wide';
  /** Right-aligned header slot — e.g. progress bar, session info */
  headerRight?: ReactNode;
}

const widths = {
  narrow: 'max-w-2xl',
  content: 'max-w-4xl',
  wide: 'max-w-6xl',
};

export function Shell({ children, maxWidth = 'content', headerRight }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-paper-300/60 bg-paper-100/80 backdrop-blur-sm sticky top-0 z-10">
        <div className={clsx('mx-auto px-6 py-4 flex items-center justify-between gap-6', widths[maxWidth])}>
          <Link
            to="/"
            className="group flex items-baseline gap-2 font-display hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl font-medium tracking-tight">Профессьянс</span>
            <span className="meta-label hidden sm:inline">методики Пряжникова</span>
          </Link>
          {headerRight && <div className="flex-1 max-w-md">{headerRight}</div>}
        </div>
      </header>

      <main className={clsx('mx-auto w-full px-6 py-10 md:py-14 flex-1', widths[maxWidth])}>
        {children}
      </main>

      <footer className="border-t border-paper-300/60 py-6 mt-16">
        <div className={clsx('mx-auto px-6 text-center meta-label', widths[maxWidth])}>
          Не психодиагностика · Активизирующая методика · Н. С. Пряжников
        </div>
      </footer>
    </div>
  );
}
