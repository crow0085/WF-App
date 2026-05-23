import { HashRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home/Home";
import "./App.css";
import Relics from "./pages/Relics/Relics";
import Equipment from "./pages/Equipment/Equipment";
import PriceCheck from "./pages/Price Check/PriceCheck";
import { stat, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { nanoid } from "nanoid";
import {
  RelicReward,
  Relic,
  EraGroups,
  categories,
  allItems,
  item_component,
  item_set,
} from "./types/types";

export function getRewardRarity(reward: any) {
  switch (reward.chance) {
    case 25.33:
      return "Common";
    case 11:
      return "Uncommon";
    case 2:
      return "Rare";
    default:
      return "unkown";
  }
}

export function mapRawToRelic(rawRelic: any) {
  const keywords = ["exceptional", "relic"];

  const name = rawRelic.name
    .split(" ")
    .filter((word: string) => !keywords.includes(word.toLowerCase()))
    .join(" ");
  const vaulted = rawRelic.vaulted;
  const era = rawRelic.name.split(" ")[0];
  const id = nanoid();

  const rewards: RelicReward[] = rawRelic.rewards
    .map((reward: any) => ({
      rarity: getRewardRarity(reward),
      chance: reward.chance,
      name: reward.item.name,
      ducats: 0,
      plat: 0,
      id: nanoid(),
      urlName: reward.item.warframeMarket?.urlName,
    }))
    .sort((a: RelicReward, b: RelicReward) => a.chance - b.chance);

  return {
    name,
    vaulted,
    era,
    id,
    rewards,
  };
}

export function mapRelicsToEra(relics: Relic[]) {
  const Lith: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Lith");
  });

  const Meso: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Meso");
  });

  const Neo: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Neo");
  });

  const Axi: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Axi");
  });

  const Requiem: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Requiem");
  });

  return {
    Lith,
    Meso,
    Neo,
    Axi,
    Requiem,
  };
}

export function setRelicDucats(relics: Relic[], masterJsonPayload: any) {
  // first 2 words are the item name, third word is the part

  const primeLookup: Record<string, any[]> = {};

  Object.entries(masterJsonPayload).forEach(([categoryName, itemsArray]) => {
    if (Array.isArray(itemsArray)) {
      itemsArray.forEach((item: any) => {
        if (item.isPrime && item.components) {
          primeLookup[item.name.toLowerCase()] = item.components;
        }
      });
    }
  });

  const mappedDucats = relics.map((relic: Relic) => {
    const updatedRwards = relic.rewards.map((reward: RelicReward) => {
      const itemNameSplit = reward.name.split(" ");
      const [first, second, ...leftover] = itemNameSplit;
      if (itemNameSplit.length > 1) {
        const name: string = [first, second].join(" ").toLowerCase(); // this will be the name of the item set eg Frost Prime
        let partName = leftover.join(" ").toLowerCase(); // this will contain the rest of the reward part, such as blueprint, chassis blueprint etc
        const parts = primeLookup[name];
        if (leftover.length > 1 && partName.toLowerCase().includes("blueprint"))
          partName = partName.replace("blueprint", "");
        if (parts) {
          const part = parts.find((part: any) =>
            partName.includes(part.name.toLowerCase()),
          );
          if (part && part.primeSellingPrice) {
            return { ...reward, ducats: part.ducats };
          }
        }
      }
      return reward;
    });
    return { ...relic, rewards: updatedRwards };
  });
  return mappedDucats;
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

function filterEquipment(masterJson: Record<string, any[]>) {
  const filteredEquipment: Record<string, any[]> = {};
  const filterList = [
    "Archwing",
    "Arch-Gun",
    "Arch-Melee",
    "Melee",
    "Pets",
    "Primary",
    "Secondary",
    "Sentinels",
    "SentinelWeapons",
    "Warframes",
  ];
  Object.entries(masterJson).forEach(([category, data]) => {
    if (filterList.includes(category)) {
      //filteredEquipment[category] = data.filter( d => d.isPrime && d.components?.map( (component: any) => component.tradable));
      const primeSets = data.filter((d) => d.isPrime);
      filteredEquipment[category] = primeSets
        .map((set) => {
          return {
            ...set,
            components: set.components
              ? set.components.filter((component: any) => component.tradable)
              : [],
          };
        })
        .filter((set: any) => set.components.length > 0);
    }
  });

  return filteredEquipment;
}

async function generateItemList(allItems: allItems) {
  let tradableItems: string[] = [];

  Object.entries(allItems).map(([category, itemSet]) => {
    console.log(category, itemSet);
    if (category === "Mods" || category === "Arcanes") {
      const cleaned = itemSet
        .filter((item: item_component) => item.tradable)
        .map((item: any) => item.name);
      tradableItems = [...tradableItems, ...cleaned];
    } else {
      // for some reason warframes tradable tag is still false even for primes, but other item sets have a true flag for tradable item sets so we can go based on the tradable property of the set itself, but based on the components.
      itemSet.map((set: item_set) => {
        const name = set.name;
        const tradable = set.components?.filter(
          (component) => component.tradable,
        );
        let fullNames: any = [];
        if (tradable) {
          fullNames = [
            ...fullNames,
            ...tradable.map((component) => `${name} ${component.name}`),
          ];
        }
        fullNames.map((n: string) => (tradableItems = [...tradableItems, n]));
      });
    }
  });

  const contents = JSON.stringify(tradableItems);

  await writeTextFile("tradable-items.json", contents, {
    baseDir: BaseDirectory.AppCache,
  });
}

export default function App() {
  const [relics, setRelics] = useState<EraGroups>();
  const [useAveragePlat, setUseAveragePlat] = useState(false);
  const [hideVaulted, setHideVaulted] = useState(false);
  const [allItems, setAllItems] = useState<allItems | undefined>();
  const [equipment, setEquipment] = useState<
    Record<string, any[]> | undefined
  >();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      categories.map((cat: string) =>
        invoke("get_warframe_items", { category: cat, forceFetch: false }).then(
          (statusMsg: any) => {
            //console.log(statusMsg);
          },
        ),
      ),
    )
      .then(() => {
        // console.log(
        //   "All individual categories ready on disk. Retrieving aggregated master JSON...",
        // );
        return invoke("merge_json_files");
      })
      .then((masterJsonPayload: any) => {
        if (masterJsonPayload.Relics) {
          const mappedRelics = masterJsonPayload.Relics.map(mapRawToRelic);
          const mappedDucats = setRelicDucats(mappedRelics, masterJsonPayload);
          const mappedByEra = mapRelicsToEra(mappedDucats);
          setRelics(mappedByEra);
        }

        const eqmt = filterEquipment(masterJsonPayload);
        setEquipment(eqmt);
        setAllItems(masterJsonPayload);
      })
      .finally(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Operation failed:", error);
      });
  }, []);

  useEffect(() => {
    if (allItems && !isLoading) {
      setIsLoading(true);
      generateItemList(allItems).finally(() => setIsLoading(false));
    }
  }, [allItems]);

  return (
    <div className="min-h-screen bg-gray-800">
      <Router>
        {!isLoading ? (
          <>
            <nav className="flex gap-4 border-2 border-gray-700 ">
              <NavLinkItem route="/" title="Home" />
              <NavLinkItem route="/relics" title="Relics" />
              <NavLinkItem route="/equipment" title="Prime Sets" />
              <NavLinkItem route="/priceCheck" title="Price Checker" />
            </nav>

            <div className="p-4!">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/relics"
                  element={
                    <Relics
                      relics={relics}
                      useAveragePlat={useAveragePlat}
                      setUseAveragePlat={setUseAveragePlat}
                      hideVaulted={hideVaulted}
                      setHideVaulted={setHideVaulted}
                    />
                  }
                />
                <Route
                  path="/equipment"
                  element={<Equipment Equipment={equipment} />}
                />
                <Route path="/priceCheck" element={<PriceCheck />} />
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
