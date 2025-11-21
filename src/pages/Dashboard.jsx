import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function Dashboard({ profile, onLogout }) {
  const [current, setCurrent] = useState("ai");
  const location = useLocation();

  // Sync current tab with URL path
  useEffect(() => {
    if (location.pathname.includes("/dashboard/integrations")) {
      setCurrent("integrations");
    } else if (location.pathname.includes("/dashboard/profile")) {
      setCurrent("profile");
    } else if (location.pathname.includes("/dashboard/analytics")) {
      setCurrent("analytics");
    } else if (location.pathname.includes("/dashboard/settings")) {
      setCurrent("settings");
    } else {
      setCurrent("ai");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-black via-gray-900 to-purple-900 text-white">
      <div className="w-64 fixed top-0 left-0 h-full z-20">
        <Sidebar profile={profile} current={current} setCurrent={setCurrent} onLogout={onLogout} />
      </div>

      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        {current === "ai" && <ChatPanel profile={profile} />}
        {current === "integrations" && <Integrations />}
        {current === "profile" && <Profile profile={profile} />}
        {current === "analytics" && <Analytics />}
        {current === "settings" && <Settings />}
      </div>
    </div>
  );
}
