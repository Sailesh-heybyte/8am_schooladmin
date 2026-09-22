import { apiCall } from "./client.js";
import { formatDate, hasValue } from "../utils/helpers.js";

const toUiParent = (parent) => ({
  parentId: parent.parent_id,
  fullName: parent.full_name,
  phone: parent.phone,
  relationship: parent.relationship,
});

const toApiParent = (parent) => ({
  parent_id: parent.parentId,
  relationship: hasValue(parent.relationship) ? parent.relationship : null,
});

const toUiStudent = (student) => ({
  id: student.id,
  schoolId: student.school_id,
  branchId: student.branch_id ?? null,
  branchName: student.branch_name,
  fullName: student.full_name,
  admissionNumber: student.admission_number,
  homeLatitude: student.home_latitude ?? null,
  homeLongitude: student.home_longitude ?? null,
  stopId: student.stop_id ?? null,
  isActive: Boolean(student.is_active),
  createdAt: formatDate(student.created_at),
  parents: student.parents.map(toUiParent),
});

const toApiStudent = (student) => {
  const body = {
    full_name: student.fullName,
    admission_number: student.admissionNumber,
    branch_id: student.branchId,
  };

  if (hasValue(student.homeLatitude)) {
    body.home_latitude = Number(student.homeLatitude);
  }
  if (hasValue(student.homeLongitude)) {
    body.home_longitude = Number(student.homeLongitude);
  }
  body.parents = [
    {
      parent_id: student.parentId,
      relationship: hasValue(student.relationship)
        ? student.relationship
        : null,
    },
  ];

  return body;
};

const toApiStudentUpdate = (student) => {
  const body = {};
  const fullName = student.fullName;
  const admissionNumber = student.admissionNumber;
  const homeLatitude = student.homeLatitude;
  const homeLongitude = student.homeLongitude;
  const isActive = student.isActive;

  if (hasValue(fullName)) {
    body.full_name = fullName;
  }
  if (hasValue(admissionNumber)) {
    body.admission_number = admissionNumber;
  }
  if (hasValue(homeLatitude)) {
    body.home_latitude = Number(homeLatitude);
  }
  if (hasValue(homeLongitude)) {
    body.home_longitude = Number(homeLongitude);
  }
  if (typeof isActive === "boolean") {
    body.is_active = isActive;
  }

  return body;
};

export const getStudents = async () => {
  const data = await apiCall("/people/students");
  return data.map(toUiStudent);
};

export const getStudent = async (id) => {
  const data = await apiCall(`/people/students/${id}`);
  return toUiStudent(data);
};

export const createStudent = (data) =>
  apiCall("/people/students", {
    method: "POST",
    body: toApiStudent(data),
  });

export const updateStudent = (id, data) =>
  apiCall(`/people/students/${id}`, {
    method: "PATCH",
    body: toApiStudentUpdate(data),
  });

export const getStudentParents = async (studentId) => {
  const data = await apiCall(`/people/students/${studentId}/parents`);
  return data.map(toUiParent);
};

export const addStudentParents = async (studentId, parents) => {
  const data = await apiCall(`/people/students/${studentId}/parents`, {
    method: "POST",
    body: { parents: parents.map(toApiParent) },
  });
  return toUiStudent(data);
};

export const assignStop = async (studentId, stopId) => {
  const data = await apiCall(`/people/students/${studentId}/assign-stop`, {
    method: "POST",
    body: { stop_id: stopId },
  });
  return toUiStudent(data);
};

export const unassignStop = async (studentId) => {
  const data = await apiCall(`/people/students/${studentId}/unassign-stop`, {
    method: "POST",
  });
  return toUiStudent(data);
};
