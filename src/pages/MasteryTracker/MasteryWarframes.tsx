import { masteryTrackerProps } from "./MasteryTracker";
import { item_set, masteryCardProps, profileWeapon } from "../../types/types";
import { useEffect, useState } from "react";

export default function MasteryWarframes(props: masteryTrackerProps) {
  const [frames, setFrames] = useState<item_set[] | undefined>();

  useEffect(() => {
    const sets: Record<string, boolean> = {};

    if (props.hideMastered === true) {
      if (props.allItems && props.profile) {
        props.allItems?.Warframes.map((frame: item_set) => {
          const mastered = props.profile?.Stats.Weapons.some(
            (item: profileWeapon) => {
              if (item.type === frame.uniqueName) {
                return item.xp > 6000; // 6000 for warframe, 3000 for weapon, 4000 for kuva weapon
              }
            },
          );
          sets[frame.uniqueName!] = mastered!;
        });
        console.log(sets);
        const filt = props.allItems?.Warframes.filter(
          (frame: item_set) =>
            frame.uniqueName! in sets && sets[frame.uniqueName!] === false,
        );
        setFrames(filt);
      }
    } else {
      setFrames(props.allItems?.Warframes);
    }
  }, [props.hideMastered]);

  return (
    <div>
      <h1 className="w-full text-white text-4xl text-center">
        <span>Warframes</span>
      </h1>
      <div className="flex flex-wrap gap-5 w-full pt-8!">
        {frames && (
          <>
            {frames.map((frame: item_set) => {
              if (frame.name !== "Helminth")
                return (
                  <MasteryCard
                    key={frame.uniqueName}
                    item={frame}
                    profile={props.profile}
                  />
                );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export function MasteryCard(props: masteryCardProps) {
  function isMastered() {
    const mastered = props.profile?.Stats.Weapons.some(
      (item: profileWeapon) => {
        if (item.type === props.item.uniqueName) {
          return item.xp > 6000; // 6000 for warframe, 3000 for weapon, 4000 for kuva weapon
        }
      },
    );

    return mastered;
  }

  return (
    <div className="relative flex p-5! h-67 w-56 bg-gray-900 border border-gray-600">
      {isMastered() ? (
        <div className="absolute top-3 right-3 z-10">
          {/*<div className="flex items-center justify-center w-8 h-8 border-2 border-green-500 rounded-full">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://w3.org"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>*/}
          <img className="h-7" src="src/images/IconMastered.png"></img>
        </div>
      ) : (
        <div className="absolute top-3 right-3 z-10">
          {/*<div className="flex items-center justify-center w-8 h-8 border-2 border-red-500 rounded-full">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://w3.org"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>*/}
        </div>
      )}
      <div className="flex flex-col items-center justify-between">
        <img
          className=""
          src={`https://cdn.warframestat.us/img/${props.item.imageName}`}
          alt="Logo"
        />
        {/*<span className={`${isMastered() ? "text-green-500" : ""}`}>
          Mastered
        </span>*/}
        <span className="text-white">{props.item.name}</span>
      </div>
    </div>
  );
}
