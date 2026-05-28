import { masteryTrackerProps } from "./MasteryTracker";
import { item_set, masteryCardProps, profileWeapon } from "../../types/types";

export default function MasteryWarframes(props: masteryTrackerProps) {
  return (
    <div>
      <h1 className="w-full text-white text-4xl text-center">Warframes</h1>
      <div className="flex flex-wrap gap-5 w-full pt-8!">
        {props.allItems &&
          props.allItems.Warframes.map((frame: item_set) => {
            if (frame.name !== "Helminth" && frame.category === "Warframes")
              return (
                <MasteryCard
                  key={frame.uniqueName}
                  item={frame}
                  profile={props.profile}
                />
              );
          })}
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
    <div className="p-5! h-67 w-56 bg-gray-900 border border-gray-600">
      <div className="flex flex-col items-center justify-between">
        <img
          className=""
          src={`https://cdn.warframestat.us/img/${props.item.imageName}`}
          alt="Logo"
        />
        <span className="text-white">{`Mastered: ${isMastered()}`}</span>
        <span className="text-white">{props.item.name}</span>
      </div>
    </div>
  );
}
