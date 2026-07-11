import type { ReactNode } from 'react';

interface WidgetProps {
  title: string;
  icon?: ReactNode;
  badge?: { text: string; color?: 'cyan' | 'crimson' };
  children: ReactNode;
  style?: React.CSSProperties;
}

export default function Widget({ title, icon, badge, children, style }: WidgetProps) {
  return (
    <div className="widget" style={style}>
      <div className="widget-header">
        {icon && <span className="widget-icon">{icon}</span>}
        <span className="widget-title">{title}</span>
        {badge && <span className={`widget-badge ${badge.color || 'cyan'}`}>{badge.text}</span>}
      </div>
      {children}
    </div>
  );
}
