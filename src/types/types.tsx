export interface RelicReward { // this is for the item offered from the relic  
  rarity: string;
  chance: number;
  name: string;
  ducats: number;
  plat: number;
  id: string;
  urlName: string
}

export interface Relic { // this is for the relic itself
  name: string;
  vaulted: boolean;
  era: string;
  id: string;
  rewards: RelicReward[];
}

export interface EraGroups {
  Lith: Relic[];
  Meso: Relic[];
  Neo: Relic[];
  Axi: Relic[];
  Requiem: Relic[];
}

export interface RelicsPageProps {
  relics: EraGroups | undefined;
  useAveragePlat: boolean;
  setUseAveragePlat: React.Dispatch<React.SetStateAction<boolean>>;
  hideVaulted: boolean;
  setHideVaulted: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface EraAccordionProps {
  eraName: string;
  relics: Relic[];
  useAveragePlat: boolean;
}

export interface EquipmentCategoryAccordionProps {
  category: string;
  sets: EquipmentSet[];
}

export interface EquipmentSet {
  name: string;
  isPrime: boolean;
  components: SetComponent[];
  vaulted: boolean;
}

export interface SetComponent {
  itemCount: number;
  name: string;
  ducats: number;
  plat: number;
  tradable: boolean;
  uniqueName: string
  type: string
}

export interface EquipmentSetAccordionProps {
  set: EquipmentSet
}

export interface EquipmentProps {
  Equipment: Record<string, any[]> | undefined
}

export interface RelicAccordionProps {
  relic: Relic
  useAveragePlat: boolean
}

export const categories = [
  'Arcanes',
  'Archwing',
  'Arch-Gun',
  'Arch-Melee',
  'Melee',
  'Mods',
  'Pets',
  'Primary',
  'Relics',
  'Secondary',
  'Sentinels',
  'SentinelWeapons',
  'Warframes'
];
