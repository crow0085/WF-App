import { useState, useEffect } from 'react';
import {EquipmentCategoryAccordionProps, EquipmentSet, EquipmentSetAccordionProps, SetComponent, EquipmentProps } from '../../types/types';




export default function Equipment(props: EquipmentProps) {

  useEffect(() => {
    if (props.Equipment) {
      Object.entries(props.Equipment).map(([category, sets]) => {
        console.log(`Category: ${category}:`, sets)
      })
    }
  }, [props.Equipment])

  return (
    <>
      <div className=" ">
        <h1 className="w-full text-white text-4xl text-center">Prime Sets</h1>
      </div>

      {props.Equipment && (
        Object.entries(props.Equipment).map(([category, sets]) => {
          return (
            sets.length > 0 &&(
              <EquipmentCategoryAccordion key={category} category={category} sets={sets} />
            )
          )
        })
      )}

    </>
  );
}

export function EquipmentSetAccordion(props: EquipmentSetAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [set, setSet] = useState<EquipmentSet>()
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [platFetched, setplatFetched] = useState(false);

  useEffect(() => {
    setSet(props.set)
  }, []);

  return (
    <div className='pl-8! p-2!'>
      <button
        className='p-4! w-full text-white text-start bg-gray-800 h-16'
        onClick={async () => {
          const nextOpenState = !isOpen;
          setIsOpen(nextOpenState);
          if (nextOpenState) console.log(props.set.components)
        }}>
        <div className={`flex gap-3 ${set?.vaulted ? "text-red-800" : "text-white"}`}>
          <span>{isOpen ? "▼" : "▶"}</span>
          <span>{set?.name}</span>
          <span>{set?.vaulted ? "Vaulted" : ""}</span>
        </div>
      </button>

      {
        isOpen && (
          <ul className='border border-gray-700 p-5! '>
            {
              set?.components.map((component: SetComponent) => (
                <div className='' key={component.uniqueName}>
                  <li className='flex gap-10 justify-start'>
                    <div className='flex gap-2 w-100 text-white'>
                      <span>x{component.itemCount}</span>
                      <span>{component.name}</span>
                    </div>
                    <div className='flex items-center text-gray-300'>
                      <span className='w-10 text-right tabular-nums'>{isPriceLoading ? "..." : `${component.plat ? component.plat + "p" : "..."}`}</span>
                      <img className='h-5' src="src/images/Platinum.png" alt="Logo" />
                    </div>
                    <div className='flex items-center text-yellow-400'>
                      <span className='w-10 text-right tabular-nums'>{component.ducats}d</span>
                      <img className='h-7' src="src/images/OrokinDucats.png" alt="Logo" />
                    </div>
                  </li>
                </div>
              ))
            }
          </ul>
        )
      }
    </div>
  )
}

export function EquipmentCategoryAccordion(props: EquipmentCategoryAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);


  return (
    <>
      <div className="p-4! bg-gray-900 border-2 border-gray-700">
        <button className='p-4! w-full text-white text-start bg-gray-800 h-16' onClick={() => {
          setIsOpen(!isOpen)
        }}>
          <div className='flex gap-3'>
            <span>{isOpen ? "▼" : "▶"}</span>
            <span>{props.category}</span>
          </div>
        </button>

        {
          isOpen && (
            <ul>
              {
                props.sets.map((set: EquipmentSet) => (
                  <EquipmentSetAccordion
                    key={set.name}
                    set={set}
                  />
                ))
              }
            </ul>
          )
        }
      </div>
    </>
  )

}