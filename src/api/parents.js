import { apiCall } from "./client.js";
import { formatDate } from "../utils/helpers.js";

const toUiParent = (parent) => ({
  id: parent.id,
  userId: parent.user_id,
  schoolId: parent.school_id,
  branchId: parent.branch_id,
  branchName: parent.branch_name,
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

export const getParents = async () => {
  const data = await apiCall("/people/parents");
  return data.map(toUiParent);
};

export const getParent = async (id) => {
  const data = await apiCall(`/people/parents/${id}`);
  return toUiParent(data);
};

export const createParent = (data) =>
  apiCall("/people/parents", {
    method: "POST",
    body: toApiParent(data),
  });

export const setParentActive = async (parentId, isActive) => {
  const data = await apiCall(`/people/parents/${parentId}`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
  return toUiParent(data);
};
