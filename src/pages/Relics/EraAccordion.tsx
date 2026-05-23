import { EraAccordionProps, Relic } from "../../types/types";
import { useState } from "react";
import { RelicAccordion } from "./RelicAccordion";

export function EraAccordion(props: EraAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="p-4! bg-gray-900 border-2 border-gray-700">
        <button
          className="p-4! w-full text-white text-start bg-gray-800 h-16"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex gap-3">
            <span>{isOpen ? "▼" : "▶"}</span>
            <span>{props.eraName}</span>
          </div>
        </button>

        {isOpen && (
          <ul>
            {props.relics.map((relic: Relic) => (
              <RelicAccordion
                key={relic.id}
                relic={relic}
                useAveragePlat={props.useAveragePlat}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
