import * as React from 'react';
import { Id, Item } from '../Item';
import { getPath, ItemMap } from '../tree';
import { Link } from './Link';
import './Breadcrumb.scss';

interface Props {
  id: Id;
  map: ItemMap;
}

interface BreadcrumbItemProps {
  item: Item;
  index: number;
}

const BreadcrumbItem = ({ item }: BreadcrumbItemProps) => {
  return (
    <li>
      <Link target={item.id}>{item.source}</Link>
    </li>
  );
};

export const Breadcrumb = ({ id, map }: Props) => {
  const path = getPath(map, id).map((item, key) => <BreadcrumbItem index={key} item={item} key={key} />);
  if (path.size === 1) {
    return null;
  } else {
    return <ol className="Breadcrumb">{path}</ol>;
  }
};
