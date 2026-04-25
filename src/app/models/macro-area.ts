import { EventCard, EventCardUI } from "./event";

export interface AreaKanban {
  id: number;
  title: string;
  cards: EventCard[];
  type: AreasType;
}

export enum AreasType
{
    Viaggi = 0,
    Convivenze = 1,
    PostCresima = 2,
    Gmg = 3
}
export interface AreasName {
    id: number;
    title: string;
}

export interface AreaUI {
  id: number;
  title: string;
  cards: EventCardUI[];
  type: AreasType;
}


