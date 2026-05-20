import { useState, useEffect } from 'react';
import { RelicReward, Relic, EraGroups } from '../../types/types';
import { invoke } from '@tauri-apps/api/core';

interface RelicsPageProps {
  relics: EraGroups | undefined;
  useAveragePlat: boolean;
  setUseAveragePlat: React.Dispatch<React.SetStateAction<boolean>>;
  hideVaulted: boolean;
  setHideVaulted: React.Dispatch<React.SetStateAction<boolean>>;
}

interface EraAccordionProps {
  eraName: string;
  relics: Relic[];
  useAveragePlat: boolean;
}

function getPlatValue(reward: RelicReward, useAveragePlat: boolean): Promise<number> {
  const slug = reward.urlName;
  console.log(reward.urlName);

  if (!slug) return Promise.resolve(0);

  const marketUrl = `https://api.warframe.market/v2/orders/item/${slug}/top`;

  return invoke("get_plat_value", { url: marketUrl })
    .then((data: any) => {
      const avg = data.data.sell.map((item: any) => item.platinum).reduce((total: number, cur: number) => total + cur, 0) / data.data.sell.length;
      console.log(`Average platinum: ${avg}`)
      const lowest = data.data.sell[0].platinum;
      console.log(`Lowest platinum: ${lowest}`)
      console.log(useAveragePlat)
      const plat = useAveragePlat ? avg : lowest
      return plat
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
        <div className='flex gap-3'>
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
        {
          props.relics ?
            (
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
            )
            :
            (
              <h1 className="text-white text-center">Currently loading relic data</h1>
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
          <button className='p-4! w-full text-white text-start bg-gray-800 h-16' onClick={() => setIsOpen(!isOpen)}>
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
                      useAveragePlat={props.useAveragePlat}
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
    useAveragePlat: boolean
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
            className='p-4! w-full text-white text-start bg-gray-800 h-16'
            onClick={async () => {

              const nextOpenState = !isOpen;
              setIsOpen(nextOpenState);

              if (nextOpenState && relic && !platFetched) {
                try {
                  setIsPriceLoading(true);
                  const platPromises = relic.rewards.map(r => getPlatValue(r, props.useAveragePlat));
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
                  setIsPriceLoading(false);               
                }
              }
            }}>
            <div className={`flex gap-3 ${relic?.vaulted ? "text-red-800" : "text-white"}`}>
              <span>{isOpen ? "▼" : "▶"}</span>
              <span>{relic?.name}</span>
              <span>{relic?.vaulted ? "Vaulted" : ""}</span>
            </div>
          </button>

          {
            isOpen && (
              <ul className='border border-gray-700 p-5! '>
                {
                  relic?.rewards.map((reward: RelicReward) => (

                    <div className='' key={reward.id}>
                      <li className='flex gap-10 justify-start'>
                        <div className='w-100 text-white'>
                          <span>{reward.name}</span>
                        </div>
                        <div className='w-30'>
                          <span className={getRarityClass(reward.rarity)}>
                            {reward.rarity}
                          </span>
                        </div>
                        <div className='flex items-center text-gray-300'>
                          <span className='w-10 text-right tabular-nums'>{isPriceLoading ? "..." : `${reward.plat}p`}</span>
                          <img className='h-5' src="src/images/Platinum.png" alt="Logo" />
                        </div>
                        <div className='flex items-center text-yellow-400'>
                          <span className='w-10 text-right tabular-nums'>{reward.ducats}d</span>
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
      </>
    )
  }
}