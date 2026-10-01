import Papa from "papaparse";

export const MAX_IMPORT_ROWS = 1000;

export const readCsvFile = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: false,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (result) => {
        const rows = result.data
          .map((record, index) => ({ record, rowNumber: index + 2 }))
          .filter(({ record }) =>
            Object.entries(record).some(
              ([key, value]) =>
                key !== "__parsed_extra" && String(value).trim() !== "",
            ),
          );
        resolve({ headers: result.meta.fields, rows });
      },
      error: reject,
    });
  });

export const downloadCsv = (fileName, rows) => {
  const blob = new Blob(["\uFEFF" + Papa.unparse(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const cell = (record, column) => String(record[column] ?? "").trim();

export const toTenDigitPhone = (value) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
};

export const missingColumns = (headers, required) =>
  required.filter((column) => !headers.includes(column));
