function FormField({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-brand-navy">
        {label}
        {required && <span className="ml-1 text-brand-red">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs leading-5 text-brand-text-body">{hint}</p>}
    </div>
  );
}

export { FormField };
