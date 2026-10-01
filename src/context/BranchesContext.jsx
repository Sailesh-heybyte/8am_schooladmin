import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { getBranches } from "../api/branches.js";

const BranchesContext = createContext(null);

export function BranchesProvider({ schoolId, children }) {
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");

  const loadedRef = useRef(false);
  const inFlightRef = useRef(null);

  const fetchBranches = useCallback(() => {
    if (!schoolId) return;
    if (inFlightRef.current) return inFlightRef.current;

    setBranchesLoading(true);
    setBranchesError("");

    const promise = getBranches(schoolId)
      .then((data) => {
        setBranches(data);
        loadedRef.current = true;
        return data;
      })
      .catch((err) => {
        setBranchesError(err.message || "Failed to load branches.");
        loadedRef.current = false;
      })
      .finally(() => {
        setBranchesLoading(false);
        inFlightRef.current = null;
      });

    inFlightRef.current = promise;
    return promise;
  }, [schoolId]);

  const loadBranches = useCallback(() => {
    if (loadedRef.current) return;
    return fetchBranches();
  }, [fetchBranches]);

  const refreshBranches = useCallback(() => {
    loadedRef.current = false;
    return fetchBranches();
  }, [fetchBranches]);

  const value = useMemo(
    () => ({
      branches,
      branchesLoading,
      branchesError,
      loadBranches,
      refreshBranches,
    }),
    [branches, branchesLoading, branchesError, loadBranches, refreshBranches]
  );

  return (
    <BranchesContext.Provider value={value}>
      {children}
    </BranchesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranches() {
  const context = useContext(BranchesContext);
  if (!context) {
    throw new Error("useBranches must be used within a BranchesProvider");
  }
  return context;
}