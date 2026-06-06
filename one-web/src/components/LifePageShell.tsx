import type { ReactNode } from 'react';

interface LifePageShellProps {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const LifePageShell = ({
  eyebrow,
  title,
  actions,
  children,
  className = ''
}: LifePageShellProps) => (
  <div className={`themed-route-page life-page-shell ${className}`.trim()}>
    <section className="life-overview-hero">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {actions}
    </section>
    {children}
  </div>
);

export default LifePageShell;
