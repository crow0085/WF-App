export const categories = [
  "Arcanes",
  "Archwing",
  "Arch-Gun",
  "Arch-Melee",
  "Melee",
  "Mods",
  "Pets",
  "Primary",
  "Relics",
  "Secondary",
  "Sentinels",
  "SentinelWeapons",
  "Warframes",
];

export interface allItems {
  Arcanes: item_component[];
  "Arch-Gun": item_set[];
  "Arch-Melee": item_set[];
  Archwing: item_set[];
  Melee: item_set[];
  Mods: item_component[];
  Pets: item_set[];
  Primary: item_set[];
  Relics: Relic[];
  Secondary: item_set[];
  SentinelWeapons: item_set[];
  Sentinels: item_set[];
  Warframes: item_set[];
}

export interface RelicReward {
  // this is for the item offered from the relic
  rarity: string;
  chance: number;
  name: string;
  ducats: number;
  plat: number;
  id: string;
  urlName: string;
}

export interface Relic {
  // this is for the relic itself
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

export interface RelicAccordionProps {
  relic: Relic;
  useAveragePlat: boolean;
}

export interface EquipmentPageProps {
  Equipment: Record<string, any[]> | undefined;
  useAveragePlat: boolean;
  setUseAveragePlat: React.Dispatch<React.SetStateAction<boolean>>;
  hideVaulted: boolean;
  setHideVaulted: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface EquipmentCategoryAccordionProps {
  category: string;
  sets: item_set[];
  useAveragePlat: boolean;
}

export interface EquipmentSetAccordionProps {
  set: item_set;
  useAveragePlat: boolean;
}

export interface item_set {
  name: string;
  uniqueName: string | undefined;
  tradable: boolean | undefined;
  isPrime: boolean | undefined;
  vaulted: boolean | undefined;
  components: item_component[];
}

export interface item_component {
  uniqueName: string | undefined;
  name: string;
  itemCount: number | undefined;
  tradable: boolean | undefined;
  plat: number | undefined;
  ducats: number | undefined;
  type: string | undefined;
}

export interface wfProfile {
  Results: profileResults;
  Stats: profileStats;
}

export interface profileResults {
  AccountId: { $oid: string };
  DisplayName: string;
  PlayerLevel: number;
  GuildName: string;
}

export interface profileStats {
  Weapons: profileWeapons[];
}

export interface profileWeapons {
  xp: number;
  type: string; // this is the unique id that will be mapped to the item name
}
