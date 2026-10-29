/**
 * DataTable Component
 * Reusable table with responsive mobile/desktop views
 */

import { Eye, Edit, Trash2 } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  onView = null,
  onEdit = null,
  onDelete = null,
  renderMobileCard = null, // Custom mobile card renderer
  keyField = 'id',
  className = '',
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12 text-sm">{emptyMessage}</div>
    );
  }

  // Default mobile card if not provided
  const defaultMobileCard = (item) => (
    <div key={item[keyField]} className="bg-white rounded-lg p-4 space-y-2.5 border border-gray-200">
      {columns.slice(0, -1).map((column, idx) => (
        <div key={idx} className="flex justify-between text-sm">
          <span className="text-gray-500">{column.header}:</span>
          <span className="font-medium text-gray-900">
            {column.render ? column.render(item) : item[column.key]}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {onView && (
          <button
            onClick={() => onView(item)}
            className="flex-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors text-xs font-medium flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="flex-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md transition-colors text-xs font-medium flex items-center justify-center gap-1"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden p-4 space-y-3">
        {data.map((item) => 
          renderMobileCard ? renderMobileCard(item) : defaultMobileCard(item)
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 
                    'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={item[keyField]} className="hover:bg-gray-50/50 transition-colors">
                {columns.map((column, idx) => (
                  <td
                    key={idx}
                    className={`px-4 py-3 text-sm ${
                      column.align === 'right' ? 'text-right' : 
                      column.align === 'center' ? 'text-center' : 
                      'text-left'
                    }`}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DataTable;
