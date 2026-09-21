import { apiCall } from "./client.js";

const toUiSchoolRole = (data) => ({
  id: data.id,
  name: data.name,
  isPlatformRole: data.is_platform_role,
  schoolId: data.school_id,
  branchId: data.branch_id,
  permissions: data.permissions,
  permissionCodenames: data.permissions.map((p) => p.codename),
});

const toApiRoleCreate = (role) => ({
  name: role.name,
  branch_id: role.branchId,
  permission_codenames: role.permissionCodenames,
});

const toApiRolePermissionsUpdate = (permissionCodenames) => ({
  permission_codenames: permissionCodenames,
});

export const getPermissions = async (scope = "school") => {
  const permissions = await apiCall("/iam/permissions");
  return permissions.filter((p) => p.scope === scope);
};

export const getRoles = () => apiCall("/iam/school-roles");

export const getSchoolRole = async (roleId) => {
  const data = await apiCall(`/iam/school-roles/${roleId}`);
  return toUiSchoolRole(data);
};

export const updateSchoolRolePermissions = async (
  roleId,
  permissionCodenames,
) => {
  const data = await apiCall(`/iam/school-roles/${roleId}/permissions`, {
    method: "PUT",
    body: toApiRolePermissionsUpdate(permissionCodenames),
  });
  return toUiSchoolRole(data);
};

export const createRole = async (data) => {
  const role = await apiCall("/iam/school-roles", {
    method: "POST",
    body: toApiRoleCreate(data),
  });
  return toUiSchoolRole(role);
};
