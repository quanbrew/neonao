import { Map } from "immutable";
import { ID, Item } from "./Item";

export type ItemMap = Map<ID, Item>;

export interface Tree {
  root: ID | null;
  map: ItemMap;
  loading: boolean;
}
