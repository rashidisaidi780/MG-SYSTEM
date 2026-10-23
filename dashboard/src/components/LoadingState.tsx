type TableLoadingStateProps = {
  columns: number;
  rows?: number;
  label?: string;
};

export function TableLoadingState({ columns, rows = 5, label = 'Loading table data' }: TableLoadingStateProps) {
  return (
    <div role="status" aria-label={label} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <span className="sr-only">{label}</span>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-hidden="true">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-5 py-4">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row} className="border-b border-neutral-100 last:border-0">
                {Array.from({ length: columns }, (_, column) => (
                  <td key={column} className="px-5 py-4">
                    <div
                      className={`h-4 animate-pulse rounded bg-neutral-100 ${
                        column === 0 ? 'w-4/5' : column === columns - 1 ? 'w-1/2' : 'w-full'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type CardGridLoadingStateProps = {
  label: string;
  count?: number;
  className?: string;
};

export function CardGridLoadingState({ label, count = 6, className = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' }: CardGridLoadingStateProps) {
  return (
    <div role="status" aria-label={label} className={className}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="rounded-3xl border border-neutral-200 bg-white p-5">
          <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-neutral-100" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-neutral-100" />
          <div className="mt-6 h-8 w-1/3 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

export function ListLoadingState({ label, count = 4 }: CardGridLoadingStateProps) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-neutral-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
