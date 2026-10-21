'use client';

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  labelledBy?: string;
};

export function MemberTabs({ tabs, active, onChange, labelledBy }: Props) {
  return (
    <div className="mk-m-tabs" role="tablist" aria-labelledby={labelledBy}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            className={`mk-m-tabs__tab${selected ? ' mk-m-tabs__tab--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
