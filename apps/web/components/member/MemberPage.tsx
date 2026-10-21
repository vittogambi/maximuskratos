import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
};

export function MemberPage({ eyebrow, title, intro, children }: Props) {
  return (
    <div className="mk-m-page">
      {eyebrow ? <p className="mk-m-eyebrow">{eyebrow}</p> : null}
      <h1 className="mk-m-title">{title}</h1>
      {intro ? <p className="mk-m-intro">{intro}</p> : null}
      {children}
    </div>
  );
}
