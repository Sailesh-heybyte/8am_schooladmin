import { apiCall } from "./client.js";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

const toUiBranch = (branch) => ({
  id: branch.id,
  schoolId: branch.school_id,
  branchName: branch.name,
  address: branch.address,
  isMainBranch: Boolean(branch.is_main_branch),
  isActive: Boolean(branch.is_active),
  createdAt: formatDate(branch.created_at),
});

// GET /api/v1/tenancy/schools/{school_id}/branches
// Branches are nested under a school; the caller must pass the school_id from getMe.
export const getBranches = async (schoolId) => {
  const data = await apiCall(`/tenancy/schools/${schoolId}/branches`);
  return data.map(toUiBranch);
};
