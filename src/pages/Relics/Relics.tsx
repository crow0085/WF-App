import { Relic, RelicsPageProps, EraGroups } from "../../types/types";
import { EraAccordion } from "./EraAccordion";
import { useEffect, useState } from "react";

export default function Relics(props: RelicsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRelics, setFilteredRelics] = useState<EraGroups>();

  useEffect(() => {
    setFilteredRelics(props.relics);
  }, [props.relics]);

  const handleInputChange = (e: any) => {
    const nextSearchTerm = e.target.value;
    setSearchTerm(nextSearchTerm);

    const term = nextSearchTerm.toLowerCase();
    if (props?.relics) {
      const filtered: EraGroups = Object.fromEntries(
        Object.entries(props.relics).map(([eraName, relicArray]) => {
          const matchingRelics = relicArray.filter((relic: Relic) => {
            // Match by Relic name
            const matchesRelicName = relic.name.toLowerCase().includes(term);

            // Match by item rewards inside the relic
            const matchesRewardName = relic.rewards.some((reward) =>
              reward.name.toLowerCase().includes(term),
            );

            return matchesRelicName || matchesRewardName;
          });

          return [eraName, matchingRelics];
        }),
      ) as EraGroups;

      //console.log(filtered);
      setFilteredRelics(filtered);
    }
  };

  return (
    <>
      {filteredRelics && (
        <>
          <div className=" ">
            <h1 className="w-full text-white text-4xl text-center">
              Relics page
            </h1>
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
              <label className="text-white flex items-center gap-2 cursor-pointer select-none">
                Search:
                <input
                  type="text"
                  className="border-2 border-gray-700"
                  placeholder="search..."
                  value={searchTerm}
                  onChange={(e) => handleInputChange(e)}
                />
              </label>
            </div>
          </div>
          <div>
            {filteredRelics ? (
              Object.entries(filteredRelics).map(([eraName, _relics]) => {
                const displayedRelics = props.hideVaulted
                  ? _relics.filter((relic: Relic) => !relic.vaulted)
                  : _relics;

                return (
                  displayedRelics.length > 0 && (
                    <EraAccordion
                      key={eraName}
                      eraName={eraName}
                      relics={displayedRelics}
                      useAveragePlat={props.useAveragePlat}
                    />
                  )
                );
              })
            ) : (
              <h1 className="text-white text-center">
                Currently loading relic data
              </h1>
            )}
          </div>
        </>
      )}
    </>
  );
}
