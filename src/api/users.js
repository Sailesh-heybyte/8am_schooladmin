import { apiCall } from "./client.js";

function parseSkills(skills) {
  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
  if (Array.isArray(skills)) {
    return skills;
  }
  return [];
}

function hasValue(val) {
  if (val === undefined || val === null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
}

function buildCleanObject(fields) {
  const cleanObj = {};
  for (const [key, value] of Object.entries(fields)) {
    if (hasValue(value)) {
      cleanObj[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  return Object.keys(cleanObj).length > 0 ? cleanObj : undefined;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function toUiUser(apiUser = {}) {
  const address = apiUser.address || {};
  const emergency = apiUser.emergency_contact || {};
  const bank = apiUser.bank_details || {};
  const government = apiUser.government_details || {};

  return {
    id: apiUser.id || "",
    fullName: apiUser.full_name || "",
    email: apiUser.email || "",
    phoneNumber: apiUser.phone_number || "",
    branchId: apiUser.branch_id,
    roleIds: apiUser.role_ids || [],
    isActive: Boolean(apiUser.is_active),
    createdAt: formatDate(apiUser.created_at),
    dateOfBirth: apiUser.date_of_birth || "",
    gender: apiUser.gender || "",
    maritalStatus: apiUser.marital_status || "",
    nationality: apiUser.nationality || "",
    joiningDate: apiUser.joining_date || "",
    addressLine1: address.address_line_1 || "",
    city: address.city || "",
    state: address.state || "",
    country: address.country || "",
    postalCode: address.postal_code || "",
    emergencyName: emergency.emergency_contact_name || "",
    emergencyRelationship: emergency.emergency_contact_relationship || "",
    emergencyPhone: emergency.emergency_contact_phone || "",
    bankName: bank.bank_name || "",
    bankAccountNumber: bank.bank_account_number || "",
    bankIfscCode: bank.bank_ifsc_code || "",
    panNumber: government.pan_number || "",
    aadhaarNumber: government.aadhaar_number || "",
    skills: apiUser.skills || [],
    notes: apiUser.notes || "",
  };
}

function toApiUser(uiUser = {}) {
  const body = {
    full_name: uiUser.fullName?.trim() || "",
    email: uiUser.email?.trim() || "",
    phone_number: uiUser.phoneNumber?.trim() || "",
    branch_id: uiUser.branchId,
    role_ids: Array.isArray(uiUser.roleIds) ? uiUser.roleIds : [],
    skills: parseSkills(uiUser.skills),
  };

  if (hasValue(uiUser.dateOfBirth))
    body.date_of_birth = uiUser.dateOfBirth.trim();
  if (hasValue(uiUser.gender)) body.gender = uiUser.gender.trim();
  if (hasValue(uiUser.maritalStatus))
    body.marital_status = uiUser.maritalStatus.trim();
  if (hasValue(uiUser.nationality))
    body.nationality = uiUser.nationality.trim();
  if (hasValue(uiUser.joiningDate))
    body.joining_date = uiUser.joiningDate.trim();
  if (hasValue(uiUser.notes)) body.notes = uiUser.notes.trim();

  const address = buildCleanObject({
    address_line_1: uiUser.addressLine1,
    city: uiUser.city,
    state: uiUser.state,
    country: uiUser.country,
    postal_code: uiUser.postalCode,
  });
  if (address) body.address = address;

  const emergencyContact = buildCleanObject({
    emergency_contact_name: uiUser.emergencyName,
    emergency_contact_relationship: uiUser.emergencyRelationship,
    emergency_contact_phone: uiUser.emergencyPhone,
  });
  if (emergencyContact) body.emergency_contact = emergencyContact;

  const bankDetails = buildCleanObject({
    bank_name: uiUser.bankName,
    bank_account_number: uiUser.bankAccountNumber,
    bank_ifsc_code: uiUser.bankIfscCode,
  });
  if (bankDetails) body.bank_details = bankDetails;

  const governmentDetails = buildCleanObject({
    pan_number: uiUser.panNumber,
    aadhaar_number: uiUser.aadhaarNumber,
  });
  if (governmentDetails) body.government_details = governmentDetails;

  return body;
}

// GET /api/v1/iam/users
export const getUsers = async () => {
  const data = await apiCall("/iam/users");
  return Array.isArray(data) ? data.map(toUiUser) : [];
};

// POST /api/v1/iam/users
export const createUser = (data) =>
  apiCall("/iam/users", {
    method: "POST",
    body: toApiUser(data),
  });
