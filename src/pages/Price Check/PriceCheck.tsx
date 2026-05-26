import { useEffect, useState, useRef } from "react";
import {
  getScreenshotableWindows,
  getWindowScreenshot,
  clearScreenshots,
} from "tauri-plugin-screenshots-api";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { convertFileSrc } from "@tauri-apps/api/core"; // Adjust imports based on your exact setup
import { fetch } from "@tauri-apps/plugin-http";

export default function PriceCheck() {
  const [imgPath, setImgPath] = useState("");
  const [items, setItems] = useState<Record<string, number>>();
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  // Track the current active mount cycle ID
  const effectCycleId = useRef(0);

  useEffect(() => {
    // Increment the cycle count every time this effect fires (Mount 1 = 1, Mount 2 = 2)
    effectCycleId.current += 1;
    const currentCycle = effectCycleId.current;
    let isMounted = true;

    const initShortcut = async () => {
      try {
        // Safely clear any stray registrations from older dead instances
        try {
          await unregister("Backquote");
        } catch (_) {}

        // If React unmounted us while this async function was waiting, stop immediately!
        if (!isMounted) return;
        await register("Backquote", async (event) => {
          if (event.state === "Pressed") {
            setIsItemsLoading(true);
            //console.log("Global backtick pressed!");
            const windows = await getScreenshotableWindows();
            const windowRecords: Record<string, number> = {};
            windows.forEach((w) => (windowRecords[w.title] = w.id));

            const windowId = windowRecords["Warframe"];
            if (windowId) {
              await clearScreenshots();
              const path = await getWindowScreenshot(windowId);
              const convertedPath = convertFileSrc(path);
              const unCached = `${convertedPath}?t=${new Date().getTime()}`;
              //console.log("image saved to: ", path);
              if (isMounted) {
                setImgPath(unCached);
                const url = `http://127.0.0.1:8008/api/items-from-img/${path}`;
                const res = await fetch(url);
                const json = await res.json();
                if (json.status == "success") {
                  const items: string[] = [
                    ...new Set(
                      json.items.map((item: any) => item.verified_name),
                    ),
                  ] as string[];

                  const itemRecord: Record<string, number> = {};
                  await Promise.all(
                    items.map(async (item, index) => {
                      //console.log(item);
                      await new Promise((resolve) =>
                        setTimeout(resolve, index * 50),
                      );
                      const plat: number = await getPlatValue(item);
                      itemRecord[item] = plat;
                    }),
                  );
                  const sorted: Record<string, number> = Object.fromEntries(
                    Object.entries(itemRecord).sort(
                      ([, p1], [, p2]) => p2 - p1,
                    ),
                  );
                  setItems(sorted);
                  setIsItemsLoading(false);
                  //console.log(itemRecord);
                }
              }
            }
          }
        });
        // console.log(
        //   `Global shortcut successfully registered on cycle ${currentCycle}!`,
        // );
      } catch (err) {
        console.error("Failed to register shortcut:", err);
      }
    };

    initShortcut();

    return () => {
      isMounted = false;

      // CRITICAL: We only call unregister if this specific execution is the LATEST active cycle.
      // In Strict Mode, cycle 1 unmounts, but cycle 2 is the latest, so cycle 1 skips unregistering!
      setTimeout(() => {
        if (currentCycle === effectCycleId.current) {
          unregister("Backquote")
            .then(() => console.log("Global shortcut cleanly wiped from OS"))
            .catch(() => {});
        } else {
          console.log(
            `Skipping cleanup for obsolete cycle ${currentCycle} to protect active shortcut.`,
          );
        }
      }, 0);
    };
  }, []);

  return (
    <div className="p-4!">
      <div className=" ">
        <h1 className="w-full text-white text-4xl text-center">
          Price checker
        </h1>
      </div>
      {items && !isItemsLoading ? (
        <div className="pl-20! pr-20!">
          <h1 className=" text-white text-2xl ">Found the following items:</h1>
          <ul className="flex flex-wrap gap-4 pt-5!">
            {Object.entries(items).map(([name, plat]) => {
              return (
                <ul key={name}>
                  <Item name={name} plat={plat} />
                </ul>
              );
            })}
          </ul>
        </div>
      ) : (
        isItemsLoading && (
          <div className="flex h-screen items-center justify-center pb-20!">
            <div className="h-15 w-15 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )
      )}
    </div>
  );
}

export interface itemProps {
  name: string;
  plat: number;
}

async function getPlatValue(itemName: string) {
  const slug = itemName
    .replace(/[" "-]/g, "_")
    .replace(/[']/g, "")
    .toLowerCase();
  const marketUrl = `https://api.warframe.market/v2/orders/item/${slug}/top`;

  const res = await fetch(marketUrl)
    .then((res) => res.json())
    .then((data) => {
      return data;
    });

  let plat = await res?.data?.sell[0]?.platinum;
  //console.log(itemName, plat, marketUrl);

  if (plat === undefined) {
    /* 
    for whatever reason
    https://api.warframe.market/v2/orders/item/nezha_prime_neuroptics/top is valid
    https://api.warframe.market/v2/orders/item/rhino_prime_neuroptics/top is valid
    https://api.warframe.market/v2/orders/item/protea_prime_neuroptics/top is not valid.... and needs to be https://api.warframe.market/v2/orders/item/protea_prime_neuroptics_blueprint/top

    so we are going to just try and append _blueprint to the end of a slug if for some reason the plat comes back as undefined as an edge case...
    */
    const newSlug = slug.concat("_blueprint");
    const fallbackMarketUrl = `https://api.warframe.market/v2/orders/item/${newSlug}/top`;
    const fallbackRes = await fetch(fallbackMarketUrl)
      .then((res) => res.json())
      .then((data) => {
        return data;
      });

    plat = await fallbackRes?.data?.sell[0].platinum;
    //console.log(itemName, plat, marketUrl);
  }

  return plat | 0;
}

function Item(props: itemProps) {
  return (
    <li>
      <div className="flex">
        <span className="text-white min-w-55">{props.name}</span>
        <div className="flex items-center text-gray-300">
          <span className="w-10 text-right tabular-nums">
            {props.plat ? props.plat + "p" : " ---"}
          </span>
          <img className="h-5" src="src/images/Platinum.png" alt="Logo" />
        </div>
      </div>
    </li>
  );
}
