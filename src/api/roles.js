import { apiCall } from "./client.js";

export const getPermissions = async (scope = "school") => {
  const permissions = await apiCall("/iam/permissions");
  return permissions.filter((p) => p.scope === scope);
};

export const getRoles = () => apiCall("/iam/school-roles");

export const assignPermissions = (roleId, codenames) =>
  apiCall(`/iam/school-roles/${roleId}/permissions`, {
    method: "POST",
    body: { permission_codenames: codenames },
  });

export const createRole = async ({ name, permissions = [] }) => {
  const role = await apiCall("/iam/school-roles", {
    method: "POST",
    body: { name, branch_id: null },
  });

  if (permissions.length > 0) {
    await assignPermissions(role.id, permissions);
  }

  return role;
};
