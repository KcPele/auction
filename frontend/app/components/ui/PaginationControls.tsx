interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationControlsProps) {
  if (total <= pageSize) return null;

  const start = page * pageSize + 1;
  const end = Math.min(total, start + pageSize - 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between gap-3 text-xs text-fg-muted"
    >
      <span>
        {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 font-medium hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={end >= total}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 font-medium hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
