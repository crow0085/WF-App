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

export function setRelicDucats(relics: Relic[], masterJsonPayload: any) {

  // first 2 words are the item name, third word is the part

  const primeLookup: Record<string, any[]> = {};

  Object.entries(masterJsonPayload).forEach(([categoryName, itemsArray]) => {
    if (Array.isArray(itemsArray)) {
      itemsArray.forEach((item: any) => {
        
        if (item.isPrime && item.components) {
          primeLookup[item.name] = item.components;
        }
      });
    }
  });

  const mappedDucats = relics.map((relic: Relic) => {
   const updatedRwards = relic.rewards.map((reward: RelicReward) => {
      const itemNameSplit = reward.name.split(" ")
      if (itemNameSplit.length > 1) {
        const name = itemNameSplit[0] + " " + itemNameSplit[1];
        const partName = itemNameSplit[2];
        
        const parts = primeLookup[name];

        if (parts){
          const part = parts.find((part: any) => part.name === partName)
          if (part && part.primeSellingPrice){
            return { ...reward, ducats: part.primeSellingPrice };
          }
        }
      }
      return reward;
    })
    return {...relic, rewards: updatedRwards};
  })

  return mappedDucats;
}

export default function App() {

  const [relics, setRelics] = useState<EraGroups>();
  const [useAveragePlat, setUseAveragePlat] = useState(false);
  const [hideVaulted, setHideVaulted] = useState(false);
  const [allItems, setAllItems] = useState();



  useEffect(() => {
    Promise.all(
      categories.map((cat: string) =>
        invoke('get_warframe_items', { category: cat, forceFetch: false })
          .then((statusMsg: any) => {
            console.log(statusMsg); 
          })
      )
    )
      .then(() => {
        console.log("All individual categories ready on disk. Retrieving aggregated master JSON...");
        return invoke('merge_json_files');
      })
      .then((masterJsonPayload: any) => {
        if (masterJsonPayload.Relics) {
          const mappedRelics = masterJsonPayload.Relics.map(mapRawToRelic);
          const mappedDucats = setRelicDucats(mappedRelics, masterJsonPayload)
          const mappedByEra = mapRelicsToEra(mappedDucats);
          setRelics(mappedByEra);
        }
        setAllItems(masterJsonPayload)
      })
      .catch((error) => {
        console.error("Operation failed:", error);
      })

  }, []);

  useEffect(() => {
    console.log(allItems)
  }, [allItems]);

  return (
    <div className="min-h-screen bg-gray-800">
      <Router>
        <nav className="flex gap-4 border-2 border-gray-700 ">

          <NavLinkItem route="/" title="Home" />

          <NavLinkItem route="/relics" title="Relics" />

          <NavLinkItem route="/equipment" title="Equipment" />

        </nav>

        <div className="p-4!">
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