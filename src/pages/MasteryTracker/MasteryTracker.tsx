import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

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
            <div></div>
            <div className="pt-4! pl-4! pr-4!">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
