import { useEffect, useState, useRef } from "react";
import {
  getScreenshotableWindows,
  getWindowScreenshot,
  clearScreenshots,
} from "tauri-plugin-screenshots-api";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { convertFileSrc } from "@tauri-apps/api/core"; // Adjust imports based on your exact setup

export default function PriceCheck() {
  const [imgPath, setImgPath] = useState("");

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
            console.log("Global backtick pressed!");
            const windows = await getScreenshotableWindows();
            const windowRecords: Record<string, number> = {};
            windows.forEach((w) => (windowRecords[w.title] = w.id));

            const windowId = windowRecords["Warframe"];
            if (windowId) {
              await clearScreenshots();
              const path = await getWindowScreenshot(windowId);
              const convertedPath = convertFileSrc(path);
              const unCached = `${convertedPath}?t=${new Date().getTime()}`;
              console.log("image saved to: ", path);
              if (isMounted) setImgPath(unCached);
            }
          }
        });
        console.log(
          `Global shortcut successfully registered on cycle ${currentCycle}!`,
        );
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
    <div>
      <h1 style={{ color: "#fff", fontSize: "2.25rem" }}>Price Check</h1>
      {imgPath !== "" && (
        <img src={imgPath} alt="screenshot" style={{ maxWidth: "100%" }} />
      )}
    </div>
  );
}
