export interface RelicReward { // this is for the item offered from the relic
  rarity: string;
  chance: number;
  name: string;
  ducats: number;
  plat: number;
  id: string;
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