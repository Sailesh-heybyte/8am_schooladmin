import Papa from "papaparse";
import { readSheet } from "read-excel-file/browser";

const toText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

export const readImportFile = async (file) => {
  const fileName = file.name.toLowerCase();
  let table;

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    table = Papa.parse(text.replace(/^\uFEFF/, ""), { skipEmptyLines: "greedy" }).data;
  } else if (fileName.endsWith(".xlsx")) {
    table = await readSheet(file);
  } else {
    throw new Error("Choose a .csv or .xlsx file.");
  }

  const [headerRow = [], ...dataRows] = table;
  const headers = headerRow.map((cell) => toText(cell).toLowerCase());

  const records = dataRows
    .map((cells) =>
      Object.fromEntries(headers.map((header, i) => [header, toText(cells[i])])),
    )
    .filter((record) => Object.values(record).some((value) => value !== ""));

  return { headers, records };
};

export const downloadCsv = (fileName, headers, rows) => {
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};
