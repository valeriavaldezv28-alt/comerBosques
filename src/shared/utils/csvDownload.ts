export type CsvCell = string | number | boolean | null | undefined;

export type CsvRow = CsvCell[];

const escapeCsvCell = (value: CsvCell): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const buildCsv = (rows: CsvRow[]): string =>
  `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;

export const downloadCsv = (rows: CsvRow[], filename: string): void => {
  const blob = new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
