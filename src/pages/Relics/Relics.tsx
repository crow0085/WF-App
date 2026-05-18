import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { nanoid } from 'nanoid';

export interface RelicReward { // this is for the item offered from the relic
  rarity: string;
  name: string;
  ducats: number;
  plat: number;
}

export interface Relic { // this is for the relic itself
  name: string;
  vaulted: boolean;
  era: string;
  uniqueName: string;
  rewards: RelicReward[];
}

interface EraGroups {
  Lith: Relic[];
  Meso: Relic[];
  Neo: Relic[];
  Axi: Relic[];
  Requiem: Relic[];
}

function mapRawToRelic(rawRelic: any) {
  const keywords = ["exceptional", "relic"];

  const name = rawRelic.name.split(' ').filter((word: string) => !keywords.includes(word.toLowerCase())).join(' ');
  const vaulted = rawRelic.vaulted;
  const era = rawRelic.name.split(" ")[0];
  const uniqueName = nanoid();

  const rewards: RelicReward[] = rawRelic.rewards.map((reward: any) => ({
    rarity: reward.rarity,
    name: reward.item.name,
    ducats: 0,
    plat: 0
  }));


  return {
    name,
    vaulted,
    era,
    uniqueName,
    rewards
  }
}

function mapRelicsToEra(relics: Relic[]) {
  const Lith: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Lith")
  })

  const Meso: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Meso")
  })

  const Neo: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Neo")
  })

  const Axi: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Axi")
  })

  const Requiem: Relic[] = relics.filter((relic: Relic) => {
    return relic.name.startsWith("Requiem")
  })


  return {
    Lith,
    Meso,
    Neo,
    Axi,
    Requiem
  }

}

export default function Relics() {
  const [relics, setRelics] = useState<EraGroups>();

  useEffect(() => {

    // Inside a function, helper, or event handler:
    invoke('get_warframe_items', { category: 'Relics', forceFetch: false })
      .then((data: any) => {
        const mappedRelics = data.map(mapRawToRelic)
        const mappedByEra = mapRelicsToEra(mappedRelics);
        setRelics(mappedByEra);
      })
      .catch((error) => {
        // If Rust hits a map_err and returns an Err(String), it ends up here
        console.error("Rust Backend Error:", error);
      });

    if (relics != null)
      console.log(relics)

    return () => console.log('cleanup');
  }, []);

  return (
    <>
      <div className="container">
        <h1 style={{ color: "#fff", fontSize: "2.25rem" }}>Relics page</h1>
      </div>
      <div>
        {
          relics &&
            (
              Object.entries(relics).map( ([eraName, relics]) => (
                <EraAccordiion
                  eraName={eraName}
                  relics={relics}
                />
              ))
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