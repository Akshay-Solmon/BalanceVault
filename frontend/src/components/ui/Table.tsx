import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  isMonospace?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  emptyMessage = 'No records found.',
  onRowClick,
}: TableProps<T>) {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-surface-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--color-surface-border)',
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)',
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                Loading verifiable ledger rows...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  borderBottom:
                    index === data.length - 1 ? 'none' : '1px solid var(--color-surface-border)',
                  transition: 'background-color var(--transition-fast)',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                className="table-row-hover"
              >
                {columns.map((col) => {
                  const content = col.render ? col.render(row, index) : (row as any)[col.key];
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: '0.875rem 1rem',
                        color: 'var(--color-text-primary)',
                        textAlign: col.align || 'left',
                        fontFamily: col.isMonospace ? 'var(--font-mono)' : 'inherit',
                        fontVariantNumeric: col.isMonospace ? 'tabular-nums' : 'normal',
                        verticalAlign: 'middle',
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
