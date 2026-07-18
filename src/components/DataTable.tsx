type DataTableProps = {
  columns: string[];
  rows: (string | number)[][];
  caption?: string;
  maxHeight?: string;
};

export default function DataTable({ columns, rows, caption, maxHeight }: DataTableProps) {
  return (
    <div className="card-surface overflow-hidden">
      {caption && (
        <div className="px-4 py-2.5 border-b border-line">
          <p className="eyebrow">{caption}</p>
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight: maxHeight ?? "420px" }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
