import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetch } from "@tauri-apps/plugin-http";

export interface player {
  AccountId: string;
  DisplayName: string;
  PlayerLevel: number;
  Weapons: weapon[];
}

// this is actually all warframe items, but on their api its called weapons
export interface weapon {
  xp: number;
  type: string;
}

export default function MasteryTracker() {
  const [id, SetId] = useState("");
  const [stats, setStats] = useState<player>();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  async function fetchPlayerStats() {
    if (!id || id === "") return;
    try {
      setIsLoading(true);
      const url = `https://api.warframe.com/cdn/getProfileViewingData.php?playerId=${id}`;
      console.log(url)
      const res = await fetch(url);
      const json = await res.json();
      const player: player = {
        AccountId: json.Results[0].AccountId,
        DisplayName: json.Results[0].DisplayName,
        PlayerLevel: json.Results[0].PlayerLevel,
        Weapons: json.Stats.Weapons,
      };
      setStats(player);
      setIsLoading(false);
      setFetchError("")
    } catch (e) {
      setIsLoading(false);
      setFetchError("Couldnt find profile")
      console.log("error trying to fetch player stats: ", e);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row">
        <div>
          <nav className="flex flex-col gap-2 border-b border-gray-700 pb-2">
            {/* Note: end ensures it only highlights when exactly on the default sub-page */}
            <NavLink
              to="warframes"
              className={({ isActive }) =>
                `p-4! text-center hover:text-blue-200 hover:bg-gray-900 ${isActive ? "text-blue-500 font-semibold" : "text-white font-normal"}`
              }
            >
              Warframes
            </NavLink>
            <NavLink
              to="primary"
              className={({ isActive }) =>
                `p-4! text-center hover:text-blue-200 hover:bg-gray-900 ${isActive ? "text-blue-500 font-semibold" : "text-white font-normal"}`
              }
            >
              Primary
            </NavLink>
            <NavLink
              to="secondary"
              className={({ isActive }) =>
                `p-4! text-center hover:text-blue-200 hover:bg-gray-900 ${isActive ? "text-blue-500 font-semibold" : "text-white font-normal"}`
              }
            >
              Secondary
            </NavLink>
          </nav>
        </div>
        <div className="p-4! flex flex-col gap-4">
          <div className="flex flex-row gap-3">
            <label className="text-white flex items-center gap-2 cursor-pointer select-none">
              WF ID:
              <input
                type="text"
                className="border-2 border-gray-700 w-75"
                placeholder="id..."
                value={id}
                onChange={(e) => SetId(e.target.value)}
              />
            </label>
            <button
              className="text-white border-2 border-gray-700 w-20 h-fit! hover:bg-gray-900 hover:text-blue-300"
              onClick={fetchPlayerStats}
            >
              submit
            </button>
          </div>
          <div>
            {isLoading && (
              <>loading player dta</>
            )}
            {stats && (
              <div>
                <span className="text-white">{`${stats.DisplayName}   ${stats.PlayerLevel}`}</span>
              </div>
            )}
            <div className="pt-4!">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
