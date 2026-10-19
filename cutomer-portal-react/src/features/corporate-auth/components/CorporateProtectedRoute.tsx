import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { CORPORATE_SESSION_ENDED, corporateSessionDeadline, endCorporateSession, getCorporateGeneration, hasCorporateSession } from "../utils/storage";

export default function CorporateProtectedRoute() {
  const [ended, setEnded] = useState(false);
  const deadline = corporateSessionDeadline();
  useEffect(() => {
    const generation = getCorporateGeneration();
    const onEnded = () => setEnded(true);
    window.addEventListener(CORPORATE_SESSION_ENDED, onEnded);
    const timer = window.setTimeout(() => {
      if (getCorporateGeneration() === generation) endCorporateSession();
    }, Math.max(0, deadline - Date.now()));
    return () => { window.clearTimeout(timer); window.removeEventListener(CORPORATE_SESSION_ENDED, onEnded); };
  }, [deadline]);
  return ended || !hasCorporateSession() ? <Navigate to="/corporate/login" replace /> : <Outlet />;
}
