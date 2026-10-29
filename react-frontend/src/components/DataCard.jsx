/**
 * DataCard Component
 * Reusable mobile card for displaying data items
 */

const DataCard = ({
  children,
  className = '',
  onClick = null,
}) => {
  return (
    <div
      className={`bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200 ${
        onClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Subcomponents for consistent card structure
DataCard.Header = ({ children, className = '' }) => (
  <div className={`flex items-start justify-between ${className}`}>
    {children}
  </div>
);

DataCard.Body = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg p-3 space-y-2 ${className}`}>
    {children}
  </div>
);

DataCard.Row = ({ label, value, className = '' }) => (
  <div className={`flex justify-between text-sm ${className}`}>
    <span className="text-gray-600">{label}:</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

DataCard.Footer = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2 pt-2 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

DataCard.Actions = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {children}
  </div>
);

export default DataCard;
