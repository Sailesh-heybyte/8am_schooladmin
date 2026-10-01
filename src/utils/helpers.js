export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

export const formatDateTime = (dateStr, fallback = "-") => {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? fallback : d.toLocaleString();
};

export const hasValue = (val) => {
  if (val === undefined || val === null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
};

export const formatEnumLabel = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");

export const normalizeDateToYMD = (dateStr) => {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateDMY = (dateStr) => {
  const ymd = normalizeDateToYMD(dateStr);
  if (!ymd) return dateStr || "-";
  const [year, month, day] = ymd.split("-");
  return `${day}-${month}-${year}`;
};

