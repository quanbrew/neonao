import * as React from 'react';
import { Id, Item } from '../Item';
import { getPath, ItemMap } from '../tree';
import { Link } from './Link';
import './Breadcrumb.scss';
import { HomeIcon } from '../icons/HomeIcon';

interface Props {
  id: Id;
  map: ItemMap;
}

interface BreadcrumbItemProps {
  item: Item;
  home: boolean;
  now: boolean;
}

const BreadcrumbItem = ({ item, home, now }: BreadcrumbItemProps) => {
  if (home) {
    return (
      <li>
        <Link target={item.id}>
          <HomeIcon />
        </Link>
      </li>
    );
  } else if (now) {
    return <li>{item.source}</li>;
  }
  return (
    <li>
      <Link target={item.id}>{item.source}</Link>
    </li>
  );
};

export const Breadcrumb = ({ id, map }: Props) => {
  const path = getPath(map, id);
  const depth = path.size;
  const items = path.map((item, key) => (
    <BreadcrumbItem home={key === 0} now={key === depth - 1} item={item} key={key} />
  ));
  if (depth === 1) {
    return null;
  } else {
    return <ol className="Breadcrumb">{items}</ol>;
  }
};
