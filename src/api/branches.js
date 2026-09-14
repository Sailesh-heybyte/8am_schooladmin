import { apiCall } from "./client.js";
import { formatDate } from "../utils/helpers.js";

const toUiBranch = (branch) => ({
  id: branch.id,
  schoolId: branch.school_id,
  branchName: branch.name,
  address: branch.address,
  isMainBranch: Boolean(branch.is_main_branch),
  isActive: Boolean(branch.is_active),
  createdAt: formatDate(branch.created_at),
});

export const getBranches = async (schoolId) => {
  const data = await apiCall(`/tenancy/schools/${schoolId}/branches`);
  return data.map(toUiBranch);
};
