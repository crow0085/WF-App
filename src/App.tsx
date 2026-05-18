import { HashRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home/Home";
import "./App.css";
import Relics from "./pages/Relics/Relics";
import Equipment from "./pages/Equipment/Equipment";

export default function App() {
  return (
    <Router>
      {/* Simple navigation bar */}
      <nav style={{ padding: "10px", background: "#242424", gap: "15px", display: "flex" }}>
        
        <NavLink 
          to="/" 
          end
          style={({ isActive }) => ({
            color: isActive ? "#4da3ff" : "#fff",
            fontWeight: isActive ? "600" : "400",
            textDecoration: "none"
          })}
        >
          Home
        </NavLink>
        
        <NavLink 
          to="/relics" 
          style={({ isActive }) => ({
            color: isActive ? "#4da3ff" : "#fff",
            fontWeight: isActive ? "600" : "400",
            textDecoration: "none"
          })}
        >
          Relics
        </NavLink>
        
        <NavLink 
          to="/equipment" 
          style={({ isActive }) => ({
            color: isActive ? "#4da3ff" : "#fff",
            fontWeight: isActive ? "600" : "400",
            textDecoration: "none"
          })}
        >
          Equipment
        </NavLink>

      </nav>

      {/* Page Switchboard */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/relics" element={<Relics />} />
        <Route path="/equipment" element={<Equipment />} />
      </Routes>
    </Router>
  );
}