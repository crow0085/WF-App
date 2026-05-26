import {
  HashRouter as Router,
  Routes,
  Route,
  NavLink,
  data,
} from "react-router-dom";
import Home from "./pages/Home/Home";
import "./App.css";
import Relics from "./pages/Relics/Relics";
import Equipment from "./pages/Equipment/Equipment";
import PriceCheck from "./pages/Price Check/PriceCheck";
import {
  stat,
  writeTextFile,
  BaseDirectory,
  exists,
  readTextFile,
} from "@tauri-apps/plugin-fs";

import { useState, useEffect } from "react";
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
import { fetch } from "@tauri-apps/plugin-http";

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

function filterEquipment(warframeItems: allItems) {
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
  Object.entries(warframeItems).forEach(([category, data]) => {
    if (filterList.includes(category)) {
      //filteredEquipment[category] = data.filter( d => d.isPrime && d.components?.map( (component: any) => component.tradable));
      const primeSets = data.filter((d: any) => d.isPrime);
      filteredEquipment[category] = primeSets
        .map((set: any) => {
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

  const contents = JSON.stringify(tradableItems, null, 2);

  await writeTextFile("tradable-items.json", contents, {
    baseDir: BaseDirectory.AppCache,
  });

  return tradableItems;
}

async function getWarframeItems() {
  const forceFetch = false;
  const refreshTime = 12;
  const merged = {} as allItems;

  const versionUrl =
    "https://data.jsdelivr.com/v1/packages/npm/@wfcd/items/resolved";

  const version = await fetch(versionUrl)
    .then((res: any) => res.json())
    .then((v) => v.version);
  //console.log(version);

  const fileName = "master-v2.json";
  const fileExists = await exists(fileName, {
    baseDir: BaseDirectory.AppCache,
  });

  let isFresh = false;

  if (fileExists) {
    const metadata = await stat(fileName, {
      baseDir: BaseDirectory.AppCache,
    });
    const modified = metadata.mtime;
    const fileAgeMs = Date.now() - modified!.getTime();
    //console.log(`File is ${fileAgeMs / 1000 / 60 / 24} hours old.`);
    const hoursOld = fileAgeMs / 1000 / 60 / 24;
    if (hoursOld > refreshTime) isFresh = false;
    else isFresh = true;
  }

  if (!isFresh || forceFetch) {
    await Promise.all(
      categories.map(async (cat: string) => {
        const url = `https://cdn.jsdelivr.net/npm/@wfcd/items@${version}/data/json/${cat}.json`;
        const data = await fetch(url)
          .then((res) => res.json())
          .then((json) => json);
        let processed_data = await processCategoryData(cat, data);
        merged[cat as keyof allItems] = processed_data;
      }),
    );

    const contents = JSON.stringify(merged, null, 2);
    await writeTextFile(fileName, contents, {
      baseDir: BaseDirectory.AppCache,
    });
  } else {
    const json = await readTextFile(fileName, {
      baseDir: BaseDirectory.AppCache,
    });

    const parsed = JSON.parse(json);
    const sorted = Object.fromEntries(
      Object.entries(parsed).sort(([cat], [cat2]) => cat.localeCompare(cat2)),
    );

    Object.entries(sorted).map(
      ([category, items]) =>
        (merged[category as keyof allItems] = items as any[]),
    );
  }

  return merged;
}

async function processCategoryData(catgory: string, json: any) {
  // 2. Route the data to the appropriate cleaner based on the requested category
  switch (catgory) {
    case "Relics":
      const cleanData = await cleanRelicData(json);
      return cleanData;
    default:
      return json;
  }
}

function cleanRelicData(json: any) {
  const cleaned = json.filter((item: any) =>
    item.name.toLowerCase().endsWith("intact"),
  );
  return cleaned;
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
    getWarframeItems()
      .then((warframeItems) => {
        const mappedRelics = warframeItems.Relics.map(mapRawToRelic);
        const mappedDucats = setRelicDucats(mappedRelics, warframeItems);
        const mappedByEra = mapRelicsToEra(mappedDucats);
        setRelics(mappedByEra);

        const eqmt = filterEquipment(warframeItems);

        setEquipment(eqmt);
        setAllItems(warframeItems);

        return generateItemList(warframeItems);
      })
      .then((tradable) => {
        const res = fetch("http://127.0.0.1:8008/api/init-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tradable), // Simple flat string array payload
        });
        return res;
      })
      .then((res) => res.json())
      .then((res) => console.log(res.status))
      .finally(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Operation failed:", error);
      });
  }, []);

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
                  element={
                    <Equipment
                      Equipment={equipment}
                      useAveragePlat={useAveragePlat}
                      setUseAveragePlat={setUseAveragePlat}
                      hideVaulted={hideVaulted}
                      setHideVaulted={setHideVaulted}
                    />
                  }
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
