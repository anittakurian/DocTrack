import { type SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={`w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg transition-all duration-200 focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 disabled:opacity-50 disabled:bg-muted ${error ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-destructive font-medium animate-fade-in">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
