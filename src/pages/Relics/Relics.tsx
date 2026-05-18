import { useState, useEffect } from 'react';
import { Relic, RelicReward, EraGroups } from '../../App';

interface RelicsPageProps {
  relics: EraGroups | undefined;
}

export default function Relics(props: RelicsPageProps) {


  return (
    <>
      <div className="container">
        <h1 style={{ color: "#fff", fontSize: "2.25rem" }}>Relics page</h1>
      </div>
      <div>
        {
          props.relics ?
            (
              Object.entries(props.relics).map( ([eraName, relics]) => (
                <EraAccordiion
                  eraName={eraName}
                  relics={relics}
                />
              ))
            )
            :
            (
              <h1>Currently loading relic data</h1>
            )
        }
      </div>
    </>
  );

  interface EraAccordionProps {
    eraName: string;
    relics: Relic[];
  }

  function EraAccordiion(props: EraAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <div>
          <button onClick={() => setIsOpen(!isOpen)}>
            <span>{props.eraName}</span>
            <span>{isOpen ? "▼" : "▶"}</span>
          </button>

          {
            isOpen && (
              <ul>
                {
                  props.relics.map( (relic: Relic) => (
                    <RelicAccordion
                      relic={relic}
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


  interface RelicAccordionProps{
    relic: Relic
  }

  function RelicAccordion (props: RelicAccordionProps){

    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <div>
          <button onClick={() => setIsOpen(!isOpen)}>
            <span>{props.relic.name}</span>
            <span>{isOpen ? "▼" : "▶"}</span>
          </button>

          {
            isOpen && (
              <ul>
                {
                  props.relic.rewards.map( (reward: RelicReward) => (
                    <li>
                      <span>{reward.name}</span>
                      <span>{reward.rarity}</span>
                    </li>
                  ))
                }
              </ul>
            )
          }
        </div>
      </>
    )
  }
}