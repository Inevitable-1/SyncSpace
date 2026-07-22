import { type InputHTMLAttributes, forwardRef } from 'react';
import { MagnifyingGlassIcon } from '../Icons';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, debounceMs = 300, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onSearch) {
        onSearch(e.target.value);
      }
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <input
          ref={ref}
          type="text"
          className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            className
          }`}
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)',
          }}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
