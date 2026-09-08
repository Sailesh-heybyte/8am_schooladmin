import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import "../../App.scss";

import { logout, getMe } from "../../api/auth.js";
import ProfileModal from "./popups/ProfileModal.jsx";

const menuItems = [
  {
    id: "dashboard",
    path: "/dashboard",
    icon: <i className="bi bi-house"></i>,
    label: "Dashboard",
  },
  {
    id: "students",
    path: "/students",
    icon: <i className="bi bi-mortarboard"></i>,
    label: "Students",
  },
  {
    id: "buses",
    path: "/buses",
    icon: <i className="bi bi-bus-front"></i>,
    label: "Buses",
  },
  {
    id: "drivers",
    path: "/drivers",
    icon: <i className="bi bi-person-badge"></i>,
    label: "Drivers",
  },
  {
    id: "stops",
    path: "/stops",
    icon: <i className="bi bi-geo-alt"></i>,
    label: "Stops",
  },
  {
    id: "parents",
    path: "/parents",
    icon: <i className="bi bi-people"></i>,
    label: "Parents",
  },
  {
    id: "branch-users",
    path: "/branch-users",
    icon: <i className="bi bi-person-gear"></i>,
    label: "Branch Users",
  },
  {
    id: "roles",
    path: "/roles",
    icon: <i className="bi bi-shield-lock"></i>,
    label: "Roles",
  },
];

function SchoolAdmin({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [me, setMe] = useState(null);

  const activeMenu = menuItems.find((item) => item.path === location.pathname);

  // Runs once per app load. A user still holding a temporary password
  // cannot reach any screen until they have changed it.
  useEffect(() => {
    getMe()
      .then((data) => {
        setMe(data);
        if (data.must_change_password) {
          navigate("/change-password", { replace: true });
        }
      })
      .catch(() => {
        navigate("/login", { replace: true });
      })
      .finally(() => setCheckingAccess(false));
  }, []);

  // Close the profile menu when clicking anywhere else.
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(".admin-profile-container")) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  if (checkingAccess) {
    return null;
  }

  return (
    <div className="admin-app">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="brand">
          <i className="bi bi-bus-front"></i>
          {sidebarOpen && (
            <div>
              <h2>
                8AM<span>Admin</span>
              </h2>
              <p>School Admin</p>
            </div>
          )}
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              style={{ textDecoration: "none", color: "inherit" }}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <span className="menu-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="admin-profile-container">
            {isProfileMenuOpen && (
              <div className="profile-menu">
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                >
                  <i className="bi bi-person"></i>
                  <span>View profile</span>
                </button>
                <button
                  type="button"
                  className="profile-menu-item danger"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign out</span>
                </button>
              </div>
            )}

            <div
              className="admin-profile"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
            >
              <div className="avatar">
                <i className="bi bi-person"></i>
              </div>
              <div className="admin-info">
                <strong>My Profile</strong>
              </div>
              <i
                className={`bi bi-chevron-${
                  isProfileMenuOpen ? "down" : "up"
                } profile-chevron`}
              ></i>
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((value) => !value)}
            >
              <i className="bi bi-list"></i>
            </button>
            <div>
              <h1>{activeMenu?.label}</h1>
              <p>8AM school transport platform</p>
            </div>
          </div>
        </header>

        <section className="page-content">
          <Outlet context={{ me }} />
        </section>
      </main>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default SchoolAdmin;
