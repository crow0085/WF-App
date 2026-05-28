import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { allItems, wfProfile } from "../../types/types";

export interface masteryTrackerProps {
  profile: wfProfile | undefined;
  allItems: allItems | undefined;
  hideMastered: boolean;
  setHideMastered: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MasteryTracker(props: masteryTrackerProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // If either piece of data is missing, force them to the home page
    if (!props.allItems || !props.profile) {
      navigate("/", { replace: true });
    }
  }, [props.allItems, props.profile, navigate]);

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
          <div className="flex flex-col gap-3">
            <div>
              {props.profile && (
                <div>
                  <span className="text-white">
                    {`${props.profile.Results.DisplayName}  ${props.profile.Results.PlayerLevel}`}
                  </span>
                  <label className="text-white flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={props.hideMastered}
                      onChange={(e) => props.setHideMastered(e.target.checked)}
                    />
                    Hide mastered
                  </label>
                </div>
              )}
            </div>
            <div>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
