import { useEffect } from "react";
import { EquipmentProps } from "../../types/types";

import { EquipmentCategoryAccordion } from "./EquipmentCategoryAccordion";

export default function Equipment(props: EquipmentProps) {
  useEffect(() => {
    // if (props.Equipment) {
    //   Object.entries(props.Equipment).map(([category, sets]) => {
    //     console.log(`Category: ${category}:`, sets);
    //   });
    // }
  }, [props.Equipment]);

  return (
    <>
      <div className=" ">
        <h1 className="w-full text-white text-4xl text-center">Prime Sets</h1>
      </div>

      {props.Equipment &&
        Object.entries(props.Equipment).map(([category, sets]) => {
          return (
            sets.length > 0 && (
              <EquipmentCategoryAccordion
                key={category}
                category={category}
                sets={sets}
              />
            )
          );
        })}
    </>
  );
}
