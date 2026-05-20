import { useState, useEffect } from 'react';
import { RelicReward, Relic, EraGroups } from '../../types/types';
import { invoke } from '@tauri-apps/api/core';

interface RelicsPageProps {
  relics: EraGroups | undefined;
}

interface EraAccordionProps {
  eraName: string;
  relics: Relic[];
}

function getPlatValue(reward: RelicReward): Promise<number> {
  const slug = reward.urlName;
  console.log(reward.urlName);

  if (!slug) return Promise.resolve(0);

  const marketUrl = `https://api.warframe.market/v2/orders/item/${slug}/top`;

  // Return the promise chain!
  return invoke("get_plat_value", { url: marketUrl })
    .then((data: any) => {
      const plat = data.data.sell[0].platinum;
      return plat;
    })
    .catch((error) => {
      console.error("Error:", error);
      return 0;
    });
}


export default function Relics(props: RelicsPageProps) {

  return (
    <>
      <div className="container">
        <h1 className="text-white text-4xl text-center">Relics page</h1>
      </div>
      <div>
        {
          props.relics ?
            (
              Object.entries(props.relics).map(([eraName, relics]) => (
                <EraAccordion
                  key={eraName}
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


  function EraAccordion(props: EraAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <div className="p-4! bg-gray-900 border-2 border-gray-700">
          <button className='text-start text-white w-full' onClick={() => setIsOpen(!isOpen)}>
            <div className='flex gap-3'>
              <span>{isOpen ? "▼" : "▶"}</span>
              <span>{props.eraName}</span>
            </div>
          </button>

          {
            isOpen && (
              <ul>
                {
                  props.relics.map((relic: Relic) => (
                    <RelicAccordion
                      key={relic.id}
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


  interface RelicAccordionProps {
    relic: Relic
  }

  function RelicAccordion(props: RelicAccordionProps) {

    const [isOpen, setIsOpen] = useState(false);
    const [relic, setRelic] = useState<Relic>()
    const [isPriceLoading, setIsPriceLoading] = useState(false);
    const [platFetched, setplatFetched] = useState(false);

    useEffect(() => {
      setRelic(props.relic)
    }, []);

    function getRarityClass(rarity: string) {
      switch (rarity.toLocaleLowerCase()) {
        case "common": return "text-yellow-700";
        case "rare": return "text-amber-400";
        case "uncommon": return "text-gray-400";
      }
    }

    return (
      <>
        <div className='pl-8! p-2!'>
          <button
            className='w-full text-white text-start'
            onClick={async () => {

              const nextOpenState = !isOpen;
              setIsOpen(nextOpenState);

              if (nextOpenState && relic && !platFetched) {
                try {
                  setIsPriceLoading(true);
                  const platPromises = relic.rewards.map(getPlatValue);
                  const platValues = await Promise.all(platPromises);

                  const updatedRewards = relic.rewards.map((reward, index) => ({
                    ...reward,
                    plat: platValues[index]
                  }));

                  setRelic({
                    ...relic,
                    rewards: updatedRewards
                  });
                  setplatFetched(true);

                } catch (err) {
                  console.error("Failed to update plat values in state:", err);
                } finally {
                  setIsPriceLoading(false); // Turn loader off                  
                }
              }
            }}>
            <div className='flex gap-3'>
              <span>{isOpen ? "▼" : "▶"}</span>
              <span>{relic?.name}</span>
            </div>
          </button>

          {
            isOpen && (
              <ul>
                {
                  relic?.rewards.map((reward: RelicReward) => (

                    <div className='pl-5!' key={reward.id}>
                      <li className='flex gap-10 justify-start'>
                        <div className='w-100 text-white'>
                          <span>{reward.name}</span>
                        </div>
                        <div className='w-30'>
                          <span className={getRarityClass(reward.rarity)}>
                            {reward.rarity}
                          </span>
                        </div>
                        <div className='w-15 text-gray-400'>
                          <span>{isPriceLoading ? "..." : `${reward.plat}p`}</span>
                        </div>
                        <div className='text-yellow-400'>
                          <span>{reward.ducats}d</span>
                        </div>
                      </li>
                    </div>
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