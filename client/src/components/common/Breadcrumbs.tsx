import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../Icons';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ArrowRightIcon className="w-4 h-4 mx-2" style={{ color: 'var(--text-tertiary)' }} />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </Link>
          ) : (
            <span
              className="flex items-center gap-1 font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
