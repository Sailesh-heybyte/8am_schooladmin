import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import AnnouncementModal from "./AnnouncementModal.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getAnnouncements } from "../../api/announcements.js";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

export default function Announcements() {
  const { me } = useOutletContext();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getAnnouncements()
      .then((data) => {
        if (!isMounted) return;
        setAnnouncements(data);
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

  const reloadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const showLoading = useDebouncedLoading(loading, 250);

  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort((a, b) =>
        b.createdAtIso.localeCompare(a.createdAtIso),
      ),
    [announcements],
  );

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Announcements"
          description="Send messages to parents on selected routes."
        />
        <AccessRestricted
          resource="announcements"
          onRetry={reloadAnnouncements}
        />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Announcements"
        description="Send messages to parents on selected routes."
        button="+ Add Announcement"
        onButtonClick={() => setIsModalOpen(true)}
      />

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
      ) : announcements.length === 0 ? (
        <div className="branch-empty-card">
          <i className="bi bi-megaphone"></i>
          <h3>No announcements found</h3>
          <p>Announcements will appear here.</p>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Title", sortKey: "title" },
            "Message",
            { label: "Routes", sortKey: "routes" },
            { label: "Created", sortKey: "created" },
          ]}
          className="users-table-card"
          rows={sortedAnnouncements.map((a) => [
            a.title,
            a.body.length > 80 ? a.body.slice(0, 80) + "…" : a.body,
            a.routeIds.length === 1 ? "1 route" : `${a.routeIds.length} routes`,
            formatDate(a.createdAtIso),
          ])}
          sortValues={sortedAnnouncements.map((a) => [
            a.title,
            null,
            a.routeIds.length,
            a.createdAtIso,
          ])}
          itemLabel="announcements"
          totalCount={announcements.length}
        />
      )}

      {isModalOpen && (
        <AnnouncementModal
          me={me}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadAnnouncements}
        />
      )}
    </>
  );
}
