import { HashRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home/Home";
import "./App.css";
import Relics from "./pages/Relics/Relics";
import Equipment from "./pages/Equipment/Equipment";


import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { nanoid } from 'nanoid';

export interface RelicReward { // this is for the item offered from the relic
  rarity: string;
  name: string;
  ducats: number;
  plat: number;
}

export interface Relic { // this is for the relic itself
  name: string;
  vaulted: boolean;
  era: string;
  uniqueName: string;
  rewards: RelicReward[];
}

export interface EraGroups {
  Lith: Relic[];
  Meso: Relic[];
  Neo: Relic[];
  Axi: Relic[];
  Requiem: Relic[];
}

function mapRawToRelic(rawRelic: any) {
  const keywords = ["exceptional", "relic"];

  const name = rawRelic.name.split(' ').filter((word: string) => !keywords.includes(word.toLowerCase())).join(' ');
  const vaulted = rawRelic.vaulted;
  const era = rawRelic.name.split(" ")[0];
  const uniqueName = nanoid();

  const rewards: RelicReward[] = rawRelic.rewards.map((reward: any) => ({
    rarity: reward.rarity,
    name: reward.item.name,
    ducats: 0,
    plat: 0
  }));


  return {
    name,
    vaulted,
    era,
    uniqueName,
    rewards
  }
}

function mapRelicsToEra(relics: Relic[]) {
  const Lith: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Lith")
  })

  const Meso: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Meso")
  })

  const Neo: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Neo")
  })

  const Axi: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Axi")
  })

  const Requiem: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Requiem")
  })


  return {
    Lith,
    Meso,
    Neo,
    Axi,
    Requiem
  }

}

export default function App() {

  const [relics, setRelics] = useState<EraGroups>();

  useEffect(() => {
    invoke('get_warframe_items', { category: 'Relics', forceFetch: false })
      .then((data: any) => {
        const mappedRelics = data.map(mapRawToRelic)
        const mappedByEra = mapRelicsToEra(mappedRelics);
        setRelics(mappedByEra);
      })
      .catch((error) => {
        // If Rust hits a map_err and returns an Err(String), it ends up here
        console.error("Rust Backend Error:", error);
      });
  }, []);



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
        <Route path="/relics" element={<Relics relics={relics}/>} />
        <Route path="/equipment" element={<Equipment />} />
      </Routes>
    </Router>
  );
}