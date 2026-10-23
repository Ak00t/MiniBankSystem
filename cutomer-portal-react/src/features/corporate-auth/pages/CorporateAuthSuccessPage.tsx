import { useNavigate } from "react-router-dom";
import { logoutCorporate } from "../api/auth";
import CorporateAuthCard from "../components/CorporateAuthCard";
import { CorporateNotice, CorporateSubmit } from "../components/CorporateForm";
import { useCorporateAction } from "../hooks/useCorporateAction";

export default function CorporateAuthSuccessPage() {
  const navigate = useNavigate();
  const action = useCorporateAction();
  return <CorporateAuthCard variant="success" title="Corporate authentication successful" description="Corporate Dashboard integration is pending.">
    <p className="mb-4 text-center text-sm leading-5 text-slate-500">You have securely signed in to Corporate Banking.</p>
    <form onSubmit={event => {
      event.preventDefault();
      void action.run(async () => {
        if (await logoutCorporate()) await navigate("/corporate/login", { replace: true });
      });
    }} className="space-y-3"><CorporateNotice error message={action.error} /><CorporateSubmit busy={action.busy}>Corporate Logout</CorporateSubmit></form>
  </CorporateAuthCard>;
}
