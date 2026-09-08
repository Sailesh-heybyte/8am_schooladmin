import { apiCall } from "./client.js";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

function hasValue(val) {
  if (val === undefined || val === null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
}

const toUiDriver = (driver) => ({
  id: driver.id,
  userId: driver.user_id,
  schoolId: driver.school_id,
  branchId: driver.branch_id ?? null,
  fullName: driver.full_name,
  phone: driver.phone,
  licenseNumber: driver.license_number,
  licenseExpiry: driver.license_expiry,
  isActive: Boolean(driver.is_active),
  createdAt: formatDate(driver.created_at),
});

const toApiDriver = (driver) => ({
  full_name: driver.fullName,
  phone: driver.phone,
  branch_id: driver.branchId,
  license_number: driver.licenseNumber,
  license_expiry: driver.licenseExpiry,
});

const toApiDriverUpdate = (driver) => {
  const body = {};
  const fullName = driver.fullName;
  const phone = driver.phone;
  const licenseNumber = driver.licenseNumber;
  const licenseExpiry = driver.licenseExpiry;

  if (hasValue(fullName)) {
    body.full_name = fullName;
  }
  if (hasValue(phone)) {
    body.phone = phone;
  }
  if (hasValue(licenseNumber)) {
    body.license_number = licenseNumber;
  }
  if (hasValue(licenseExpiry)) {
    body.license_expiry = licenseExpiry;
  }

  return body;
};

export const getDrivers = async () => {
  const data = await apiCall("/people/drivers");
  return data.map(toUiDriver);
};

export const getDriver = async (id) => {
  const data = await apiCall(`/people/drivers/${id}`);
  return toUiDriver(data);
};

export const createDriver = (data) =>
  apiCall("/people/drivers", {
    method: "POST",
    body: toApiDriver(data),
  });

export const updateDriver = (id, data) =>
  apiCall(`/people/drivers/${id}`, {
    method: "PATCH",
    body: toApiDriverUpdate(data),
  });
