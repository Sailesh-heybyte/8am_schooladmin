import { apiCall } from "./client";

const toUiComplaint = (c) => ({
  id: c.id,
  schoolId: c.school_id,
  branchId: c.branch_id,
  createdBy: c.created_by,
  studentId: c.student_id,
  subject: c.subject,
  description: c.description,
  category: c.category,
  status: c.status,
  resolutionNote: c.resolution_note,
  resolvedBy: c.resolved_by,
  createdAtIso: c.created_at,
  updatedAtIso: c.updated_at,
  resolvedAtIso: c.resolved_at,
});

const toApiComplaintUpdate = (ui) => ({
  status: ui.status,
  resolution_note: ui.resolutionNote,
});

export const getComplaints = async () => {
  const response = await apiCall("/complaints");
  return response.map(toUiComplaint);
};

export const updateComplaint = async (id, uiUpdate) => {
  const response = await apiCall(`/complaints/${id}`, {
    method: "PATCH",
    body: toApiComplaintUpdate(uiUpdate),
  });
  return toUiComplaint(response);
};
