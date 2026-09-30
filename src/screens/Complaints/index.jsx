import { useState, useEffect, useMemo } from "react";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import TypeAhead from "../../components/TypeAhead.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import ComplaintModal from "./ComplaintModal.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { formatDateTime, formatEnumLabel } from "../../utils/helpers.js";
import { getComplaints } from "../../api/complaints.js";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getComplaints()
      .then((data) => {
        if (!isMounted) return;
        setComplaints(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaints();
      setComplaints(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const sortedComplaints = useMemo(
    () =>
      [...complaints].sort((a, b) =>
        b.createdAtIso.localeCompare(a.createdAtIso),
      ),
    [complaints],
  );

  const statusOptions = useMemo(
    () =>
      [...new Set(complaints.map((c) => c.status))].map((s) => ({
        value: s,
        label: formatEnumLabel(s),
      })),
    [complaints],
  );

  const categoryOptions = useMemo(
    () =>
      [...new Set(complaints.map((c) => c.category))].map((s) => ({
        value: s,
        label: formatEnumLabel(s),
      })),
    [complaints],
  );

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return sortedComplaints.filter((c) => {
      if (query) {
        const subjectMatch = c.subject.toLowerCase().includes(query);
        const descriptionMatch = c.description.toLowerCase().includes(query);
        if (!subjectMatch && !descriptionMatch) return false;
      }

      if (statusFilter && c.status !== statusFilter) {
        return false;
      }

      if (categoryFilter && c.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [sortedComplaints, searchQuery, statusFilter, categoryFilter]);

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter || categoryFilter,
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCategoryFilter("");
  };

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Complaints"
          description="Review and resolve complaints from parents."
        />
        <AccessRestricted
          resource="complaints"
          onRetry={reloadComplaints}
        />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Complaints"
        description="Review and resolve complaints from parents."
      />

      <div className="filter-card admin-filter">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Status:</label>
            <TypeAhead
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All"
              noMatchMessage="No statuses found"
            />
          </div>

          <div className="filter-group">
            <label>Category:</label>
            <TypeAhead
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All"
              noMatchMessage="No categories found"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="secondary-button"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          )}
        </div>

        <input
          id="complaint-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by subject or description..."
        />
      </div>

      {error && (
        <div className="roles-error">
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="table-card">
          <div className="table-empty">
            <span>{showLoading ? "Loading…" : ""}</span>
          </div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="branch-empty-card">
          <i className="bi bi-chat-left-text"></i>
          <h3>No complaints found</h3>
          <p>Complaints from parents will appear here.</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="branch-empty-card">
          <i className="bi bi-funnel"></i>
          <h3>No matching complaints found</h3>
          <p>
            No complaints match your filter criteria. Try adjusting or clearing your
            filters.
          </p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Subject", sortKey: "subject" },
            { label: "Category", sortKey: "category" },
            { label: "Status", sortKey: "status" },
            { label: "Created", sortKey: "created" },
          ]}
          className="users-table-card"
          rows={filteredComplaints.map((c) => [
            c.subject.length > 60 ? c.subject.slice(0, 60) + "…" : c.subject,
            formatEnumLabel(c.category),
            <StatusBadge key={`status-${c.id}`} status={c.status} />,
            formatDateTime(c.createdAtIso),
          ])}
          sortValues={filteredComplaints.map((c) => [
            c.subject,
            c.category,
            c.status,
            c.createdAtIso,
          ])}
          itemLabel="complaints"
          totalCount={complaints.length}
          onRowClick={(index) => setSelectedComplaint(filteredComplaints[index])}
        />
      )}

      {selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onSaved={reloadComplaints}
        />
      )}
    </>
  );
}
