import { HashRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home/Home";
import "./App.css";
import Relics from "./pages/Relics/Relics";
import Equipment from "./pages/Equipment/Equipment";


import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { nanoid } from 'nanoid';
import { RelicReward, Relic, EraGroups } from "./types/types";

export function getRewardRarity(reward: any) {
  switch (reward.chance) {
    case 25.33: return "Common"
    case 11: return "Uncommon"
    case 2: return "Rare"
    default: return "unkown"
  }
}

export function mapRawToRelic(rawRelic: any) {
  const keywords = ["exceptional", "relic"];

  const name = rawRelic.name.split(' ').filter((word: string) => !keywords.includes(word.toLowerCase())).join(' ');
  const vaulted = rawRelic.vaulted;
  const era = rawRelic.name.split(" ")[0];
  const id = nanoid();

  const rewards: RelicReward[] = rawRelic.rewards.map((reward: any) => ({
    rarity: getRewardRarity(reward),
    chance: reward.chance,
    name: reward.item.name,
    ducats: 0,
    plat: 0,
    id: nanoid(),
    urlName: reward.item.warframeMarket?.urlName
  })).sort((a: RelicReward, b: RelicReward) => a.chance - b.chance);

  return {
    name,
    vaulted,
    era,
    id,
    rewards
  }
}

export function mapRelicsToEra(relics: Relic[]) {
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

function NavLinkItem(props: any) {
  return (
    <NavLink
      to={props.route}
      end
      className={({ isActive }) =>
        `p-4! text-center hover:text-blue-200 hover:bg-gray-900 ${isActive ? "text-blue-500 font-semibold" : "text-white font-normal"}`
      }
    >
      {props.title}
    </NavLink>
  );
}

const categories = [
  'Arcanes',
  'Archwing',
  'Arch-Gun',
  'Arch-Melee',
  'Melee',
  'Mods',
  'Pets',
  'Primary',
  'Relics',
  'Secondary',
  'Sentinels',
  'SentinelWeapons',
  'Warframes'
];

export default function App() {

  const [relics, setRelics] = useState<EraGroups>();
  const [useAveragePlat, setUseAveragePlat] = useState(false);
  const [hideVaulted, setHideVaulted] = useState(false);



  useEffect(() => {
    Promise.all(categories.map((cat: string) =>
      invoke('get_warframe_items', { category: cat, forceFetch: false })
        .then((data: any) => ({
          category: cat,
          data
        }))
        .then((res: any) => {
          switch (res.category) {
            case "Relics":
              const mappedRelics = res.data.map(mapRawToRelic)
              //getPlatValue(mappedRelics[0].rewards[0]);
              const mappedByEra = mapRelicsToEra(mappedRelics);
              setRelics(mappedByEra);
              break;
          }
        })
    ))
      .catch((error) => {
        // If Rust hits a map_err and returns an Err(String), it ends up here
        console.error("Rust Backend Error:", error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-800">
      <Router>
        {/* Simple navigation bar */}
        <nav className="flex gap-4 border-2 border-gray-700 ">

          <NavLinkItem route="/" title="Home" />

          <NavLinkItem route="/relics" title="Relics" />

          <NavLinkItem route="/equipment" title="Equipment" />

        </nav>

        <div className="p-4!">
          {/* Page Switchboard */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/relics" element={
              <Relics
                relics={relics}
                useAveragePlat={useAveragePlat}
                setUseAveragePlat={setUseAveragePlat}
                hideVaulted={hideVaulted}
                setHideVaulted={setHideVaulted}
              />}
            />
            <Route path="/equipment" element={<Equipment />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}