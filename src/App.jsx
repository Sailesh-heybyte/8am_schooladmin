import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./screens/Login/index.jsx";
import ChangePassword from "./screens/ChangePassword/index.jsx";
import SchoolAdmin from "./screens/SchoolAdmin/index.jsx";
import Roles from "./screens/Roles/index.jsx";
import BranchUsers from "./screens/BranchUsers/index.jsx";
import Buses from "./screens/Buses/index.jsx";
import Drivers from "./screens/Drivers/index.jsx";
import Students from "./screens/Students/index.jsx";
import Parents from "./screens/Parents/index.jsx";
import Stops from "./screens/Stops/index.jsx";
import RoutesScreen from "./screens/Routes/index.jsx";

// Placeholders until each feature screen is built.
const Placeholder = ({ name }) => <p>{name} screen coming soon.</p>;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("school_access_token"),
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/change-password"
          element={
            isAuthenticated ? (
              <ChangePassword />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          element={
            isAuthenticated ? (
              <SchoolAdmin onLogout={() => setIsAuthenticated(false)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/dashboard" element={<Placeholder name="Dashboard" />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/branch-users" element={<BranchUsers />} />
          <Route path="/buses" element={<Buses />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/students" element={<Students />} />
          <Route path="/stops" element={<Stops />} />
          <Route path="/routes" element={<RoutesScreen />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
