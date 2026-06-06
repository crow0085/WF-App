import {
  HashRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import "./App.css";

import Home from "./pages/Home/Home";

import {
  stat,
  writeTextFile,
  BaseDirectory,
  exists,
  readTextFile,
} from "@tauri-apps/plugin-fs";

import { useState, useEffect } from "react";

interface NavLinkProps {
  route: string;
  title: string;
  end?: boolean; // Optional prop, defaults to false if not passed
}

function NavLinkItem(props: NavLinkProps) {
  return (
    <NavLink
      to={props.route}
      end={props.end}
      className={({ isActive }) =>
        `p-4! text-center hover:text-blue-200 hover:bg-gray-900 ${isActive ? "text-blue-500 font-semibold" : "text-white font-normal"}`
      }
    >
      {props.title}
    </NavLink>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-800">
      <Router>
        {!isLoading ? (
          <>
            <nav className="flex gap-4 border-b border-gray-700 ">
              <NavLinkItem route="/" title="Home" end={true} />
            </nav>

            <div className="">
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
            </div>
          </>
        ) : (
          <>
            <span className="text-gray-400 ml-auto animate-pulse">
              Loading Ordis inventory...
            </span>
          </>
        )}
      </Router>
    </div>
  );
}
