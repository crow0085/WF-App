import { useEffect, useState } from "react";
import { EquipmentPageProps, item_set } from "../../types/types";

import { EquipmentCategoryAccordion } from "./EquipmentCategoryAccordion";

export default function Equipment(props: EquipmentPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] =
    useState<Record<string, any[]>>();

  useEffect(() => {
    setFilteredEquipment(props.Equipment);
  }, [props.Equipment]);

  const handleInputChange = (e: any) => {
    const nextSearchTerm = e.target.value;
    setSearchTerm(nextSearchTerm);

    const term = nextSearchTerm.toLowerCase();
    if (props?.Equipment) {
      const filtered: Record<string, any[]> = Object.fromEntries(
        Object.entries(props.Equipment).map(([cat, eq]) => {
          const matchingSets = eq.filter((set: item_set) => {
            // Match by Relic name
            const matchesRelicName = set.name.toLowerCase().includes(term);

            // Match by item rewards inside the relic
            const matchesRewardName = set.components.some((component) =>
              component.name.toLowerCase().includes(term),
            );

            return matchesRelicName || matchesRewardName;
          });

          return [cat, matchingSets];
        }),
      );

      //console.log(filtered);
      setFilteredEquipment(filtered);
    }
  };

  return (
    <>
      <div className=" ">
        <div className=" ">
          <h1 className="w-full text-white text-4xl text-center">Prime Sets</h1>
        </div>
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

      {filteredEquipment &&
        Object.entries(filteredEquipment!).map(([category, sets]) => {
          const displayedEquipment = props.hideVaulted
            ? sets.filter((set: item_set) => !set.vaulted)
            : sets;

          return (
            displayedEquipment.length > 0 && (
              <EquipmentCategoryAccordion
                key={category}
                category={category}
                sets={displayedEquipment}
                useAveragePlat={props.useAveragePlat}
              />
            )
          );
        })}
    </>
  );
}
