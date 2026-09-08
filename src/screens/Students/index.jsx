import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StudentModal from "./StudentModal.jsx";
import StudentDetailsModal from "./StudentDetailsModal.jsx";
import StudentParentsModal from "./StudentParentsModal.jsx";
import AddParentModal from "./AddParentModal.jsx";
import { getStudents } from "../../api/students.js";

function renderParentsCell(parents = []) {
  if (!parents || parents.length === 0) {
    return <span className="muted-cell">-</span>;
  }
  if (parents.length <= 2) {
    return parents.map((p) => p.fullName).join(", ");
  }
  const firstTwo = parents
    .slice(0, 2)
    .map((p) => p.fullName)
    .join(", ");
  const remaining = parents.length - 2;
  return `${firstTwo}, +${remaining} more`;
}

export default function Students() {
  const { me } = useOutletContext() || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentForDetails, setStudentForDetails] = useState(null);
  const [studentForParents, setStudentForParents] = useState(null);
  const [studentForAddParent, setStudentForAddParent] = useState(null);

  // Track the open three-dot menu by student id (only one open at a time)
  const [openMenuStudentId, setOpenMenuStudentId] = useState(null);

  // Load students on mount. This is the ONLY request this screen makes on page load.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    getStudents()
      .then((data) => {
        if (!isMounted) return;
        setStudents(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load students.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close the three-dot action menu when clicking anywhere outside
  useEffect(() => {
    if (!openMenuStudentId) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(".actions-menu-container")) {
        setOpenMenuStudentId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuStudentId]);

  const reloadStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
      console.log(data);
    } catch (err) {
      setError(err.message || "Failed to reload students.");
    }
  };

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = (student.fullName || "").toLowerCase().includes(query);
    const admMatch = (student.admissionNumber || "")
      .toLowerCase()
      .includes(query);
    return nameMatch || admMatch;
  });

  const openCreate = () => {
    setStudentToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (student) => {
    setStudentToEdit(student);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageTitle
        title="Students"
        description="Manage student records, parent contacts, and enrollments."
        button="+ Add Student"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name or admission number..."
        />
      </div>

      {error && (
        <div
          className="roles-error"
          style={{ margin: "1rem 0", color: "#d9534f" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p
          className="roles-message"
          style={{ margin: "1.5rem 0", color: "#667085" }}
        >
          Loading students...
        </p>
      ) : students.length === 0 && !searchQuery ? (
        <div className="branch-empty-card">
          <i className="bi bi-mortarboard"></i>
          <h3>No students found</h3>
          <p>Get started by adding the first student to your school.</p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={openCreate}
          >
            + Add Student
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            "Name",
            "Admission No.",
            "Branch",
            "Parents",
            "Status",
            "Actions",
          ]}
          className="users-table-card"
          rows={filteredStudents.map((student) => [
            <strong key={`name-${student.id}`}>{student.fullName}</strong>,
            student.admissionNumber || (
              <span key={`adm-${student.id}`} className="muted-cell">
                -
              </span>
            ),
            // Raw branch_id shown until backend returns branch_name directly
            student.branchId ? (
              <code key={`branch-${student.id}`}>{student.branchId}</code>
            ) : (
              <span key={`branch-${student.id}`} className="muted-cell">
                Not assigned
              </span>
            ),
            <span key={`parents-${student.id}`}>
              {renderParentsCell(student.parents)}
            </span>,
            <StatusBadge
              key={`status-${student.id}`}
              status={student.isActive ? "Active" : "Inactive"}
            />,
            <div
              key={`actions-${student.id}`}
              className="actions-menu-container"
            >
              <button
                type="button"
                className="action-icon"
                title="Actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuStudentId((prev) =>
                    prev === student.id ? null : student.id,
                  );
                }}
              >
                <i className="bi bi-three-dots-vertical"></i>
              </button>

              {openMenuStudentId === student.id && (
                <div className="actions-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuStudentId(null);
                      setStudentForDetails(student);
                    }}
                  >
                    <i className="bi bi-eye"></i>
                    <span>View details</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuStudentId(null);
                      setStudentForParents(student);
                    }}
                  >
                    <i className="bi bi-people"></i>
                    <span>List parents</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuStudentId(null);
                      openEdit(student);
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuStudentId(null);
                      setStudentForAddParent(student);
                    }}
                  >
                    <i className="bi bi-person-plus"></i>
                    <span>Add parent</span>
                  </button>
                </div>
              )}
            </div>,
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredStudents.length} of ${students.length} students`}
        />
      )}

      {isModalOpen && (
        <StudentModal
          isOpen={isModalOpen}
          student={studentToEdit}
          schoolId={me?.school_id}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadStudents}
        />
      )}

      {Boolean(studentForDetails) && (
        <StudentDetailsModal
          isOpen={Boolean(studentForDetails)}
          student={studentForDetails}
          onClose={() => setStudentForDetails(null)}
        />
      )}

      {Boolean(studentForParents) && (
        <StudentParentsModal
          isOpen={Boolean(studentForParents)}
          student={studentForParents}
          onClose={() => setStudentForParents(null)}
        />
      )}

      {Boolean(studentForAddParent) && (
        <AddParentModal
          isOpen={Boolean(studentForAddParent)}
          student={studentForAddParent}
          onClose={() => setStudentForAddParent(null)}
          onSaved={reloadStudents}
        />
      )}
    </>
  );
}
