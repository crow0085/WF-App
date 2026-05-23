import { Relic, RelicsPageProps } from "../../types/types";
import { EraAccordion } from "./EraAccordion";

export default function Relics(props: RelicsPageProps) {
  return (
    <>
      <div className=" ">
        <h1 className="w-full text-white text-4xl text-center">Relics page</h1>
        <div className="flex gap-3">
          <label className="text-white flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={props.useAveragePlat}
              onChange={(e) => props.setUseAveragePlat(e.target.checked)}
            />
            Use Average Plat Prices
          </label>
          <label className="text-white flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={props.hideVaulted}
              onChange={(e) => props.setHideVaulted(e.target.checked)}
            />
            Hide vaulted
          </label>
        </div>
      </div>
      <div>
        {props.relics ? (
          Object.entries(props.relics).map(([eraName, relics]) => {
            const displayedRelics = props.hideVaulted
              ? relics.filter((relic: Relic) => !relic.vaulted)
              : relics;

            return (
              <EraAccordion
                key={eraName}
                eraName={eraName}
                relics={displayedRelics}
                useAveragePlat={props.useAveragePlat}
              />
            );
          })
        ) : (
          <h1 className="text-white text-center">
            Currently loading relic data
          </h1>
        )}
      </div>
    </>
  );
}
