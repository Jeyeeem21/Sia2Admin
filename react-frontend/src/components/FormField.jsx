/**
 * FormField Component
 * Reusable form input field with label and error
 */

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  icon: Icon = null,
  options = [], // For select inputs
  rows = 3, // For textarea
  min,
  max,
  step,
  accept, // For file inputs
}) => {
  const baseInputClass = `w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-colors ${
    error ? 'border-red-400' : 'border-gray-300'
  } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'} ${inputClassName}`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputClass}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            className={baseInputClass}
          >
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={value}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor={name} className="ml-2 text-sm text-gray-700">
              {label}
            </label>
          </div>
        );

      default:
        return (
          <div className="relative">
            {Icon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <input
              type={type}
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              accept={accept}
              className={`${baseInputClass} ${Icon ? 'pl-11' : ''}`}
            />
          </div>
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className={className}>
        {renderInput()}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;
