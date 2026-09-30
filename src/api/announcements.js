import { apiCall } from "./client";

const toUiAnnouncement = (a) => ({
  id: a.id,
  schoolId: a.school_id,
  branchId: a.branch_id,
  createdBy: a.created_by,
  title: a.title,
  body: a.body,
  routeIds: a.route_ids,
  createdAtIso: a.created_at,
});

const toApiAnnouncement = (ui) => ({
  title: ui.title,
  body: ui.body,
  route_ids: ui.routeIds,
});

export const getAnnouncements = async () => {
  const response = await apiCall("/announcements");
  return response.map(toUiAnnouncement);
};

export const createAnnouncement = async (uiAnnouncement) => {
  const response = await apiCall("/announcements", {
    method: "POST",
    body: toApiAnnouncement(uiAnnouncement),
  });
  return toUiAnnouncement(response);
};
