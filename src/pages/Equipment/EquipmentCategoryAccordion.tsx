import { useState } from "react";
import {
  EquipmentCategoryAccordionProps,
  EquipmentSet,
} from "../../types/types";
import { EquipmentSetAccordion } from "./EquipmentSetAccordion";

export function EquipmentCategoryAccordion(
  props: EquipmentCategoryAccordionProps,
) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="p-4! bg-gray-900 border-2 border-gray-700">
        <button
          className="p-4! w-full text-white text-start bg-gray-800 h-16"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <div className="flex gap-3">
            <span>{isOpen ? "▼" : "▶"}</span>
            <span>{props.category}</span>
          </div>
        </button>

        {isOpen && (
          <ul>
            {props.sets.map((set: EquipmentSet) => (
              <EquipmentSetAccordion key={set.name} set={set} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
