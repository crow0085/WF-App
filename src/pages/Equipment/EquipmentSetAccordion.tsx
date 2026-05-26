import { useState, useEffect } from "react";
import {
  item_set,
  EquipmentSetAccordionProps,
  item_component,
} from "../../types/types";
import { fetch } from "@tauri-apps/plugin-http";

// doing this on the js side instead of react because im lazy
async function getItemSlugs(primeSet: item_set) {
  // https://api.warframe.market/v2/item/{slug}/set
  const setSlug = primeSet.name
    .replace(/[" "]/g, "_")
    .replace(/[&]/g, "and")
    .concat("_set")
    .toLowerCase();
  const url = `https://api.warframe.market/v2/item/${setSlug}/set`;

  const res = await fetch(url)
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
  const items = res.data.items.slice(1); // removing the first element since its just the slug of the set itself.

  const slugs = Object.entries(items).map(([id, item]: any) => {
    return item.slug;
  });

  return slugs;
}

async function getPlatValues(
  primeSet: item_set,
  useAveragePlat: Boolean = false,
) {
  const slugs: string[] = await getItemSlugs(primeSet);
  const setName = primeSet.name;

  const platMap: Record<string, number> = {};

  await Promise.all(
    primeSet.components.map(async (component: item_component) => {
      const potentialSlug = setName
        .concat(" ")
        .concat(component.name)
        .replace(/[" "]/g, "_")
        .toLowerCase();
      const slug = slugs.filter((s) => s.includes(potentialSlug))[0];
      //console.log(slug);
      if (!slug) platMap[component.name] = 0;
      else {
        const marketUrl = `https://api.warframe.market/v2/orders/item/${slug}/top`;
        const res = await fetch(marketUrl)
          .then((res) => res.json())
          .then((data) => {
            return data;
          });
        platMap[component.name] = res.data.sell[0].platinum;
      }
    }),
  );

  const mapped = primeSet.components.map((component: item_component) => {
    return {
      ...component,
      plat: platMap[component.name],
    };
  });

  return mapped;
}

export function EquipmentSetAccordion(props: EquipmentSetAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [set, setSet] = useState<item_set>();
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [platFetched, setplatFetched] = useState(false);

  useEffect(() => {
    setSet(props.set);
  }, [props]);

  return (
    <div className="pl-8! p-2!">
      <button
        className="p-4! w-full text-white text-start bg-gray-800 h-16"
        onClick={async () => {
          const nextOpenState = !isOpen;
          setIsOpen(nextOpenState);
          if (nextOpenState && set && !platFetched) {
            const platMapped = await getPlatValues(set);
            setSet({
              ...set,
              components: platMapped,
            });
            setIsPriceLoading(false);
            setplatFetched(true);
          }
        }}
      >
        <div
          className={`flex gap-3 ${set?.vaulted ? "text-red-800" : "text-white"}`}
        >
          <span>{isOpen ? "▼" : "▶"}</span>
          <span>{set?.name}</span>
          <span>{set?.vaulted ? "Vaulted" : ""}</span>
        </div>
      </button>

      {isOpen && (
        <ul className="border border-gray-700 p-5! ">
          {set?.components.map((component: item_component) => (
            <div className="" key={component.uniqueName}>
              <li className="flex gap-10 justify-start">
                <div className="flex gap-2 w-100 text-white">
                  <span>x{component.itemCount}</span>
                  <span>{component.name}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  {isPriceLoading ? (
                    <div className="w-10 text-right tabular-nums flex items-end justify-end">
                      <div className="h-4 w-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <span className="w-10 text-right tabular-nums">
                      {component.plat ? component.plat + "p" : " ---"}
                    </span>
                  )}
                  <img
                    className="h-5"
                    src="src/images/Platinum.png"
                    alt="Logo"
                  />
                </div>
                <div className="flex items-center text-yellow-400">
                  <span className="w-10 text-right tabular-nums">
                    {component.ducats}d
                  </span>
                  <img
                    className="h-7"
                    src="src/images/OrokinDucats.png"
                    alt="Logo"
                  />
                </div>
              </li>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}
