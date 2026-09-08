import { apiCall } from "./client.js";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

const toUiParent = (parent) => ({
  id: parent.id,
  userId: parent.user_id,
  schoolId: parent.school_id,
  branchId: parent.branch_id,
  fullName: parent.full_name,
  phone: parent.phone,
  isActive: Boolean(parent.is_active),
  createdAt: formatDate(parent.created_at),
});

const toApiParent = (parent) => ({
  full_name: parent.fullName,
  phone: parent.phone,
  branch_id: parent.branchId,
});

// GET /api/v1/people/parents
export const getParents = async () => {
  const data = await apiCall("/people/parents");
  return data.map(toUiParent);
};

// GET /api/v1/people/parents/{parent_id}
export const getParent = async (id) => {
  const data = await apiCall(`/people/parents/${id}`);
  return toUiParent(data);
};

// POST /api/v1/people/parents
export const createParent = (data) =>
  apiCall("/people/parents", {
    method: "POST",
    body: toApiParent(data),
  });

// PATCH /api/v1/people/parents/{parent_id}
// Endpoint accepts is_active only
export const setParentActive = async (parentId, isActive) => {
  const data = await apiCall(`/people/parents/${parentId}`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
  return toUiParent(data);
};
