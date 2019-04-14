import * as React from 'react';
import { Id, Item } from '../Item';
import { getPath, ItemMap } from '../tree';
import * as actions from '../actions';
import { ViewDispatch } from './List';
import { makePathById } from '../path';

interface Props {
  id: Id;
  map: ItemMap;
  dispatch: ViewDispatch;
}

const BreadcrumbItem = ({ item, zoom }: { item: Item; zoom: (id: Id) => void }) => {
  const handleClick: React.MouseEventHandler = e => {
    e.preventDefault();
    zoom(item.id);
  };
  return (
    <li>
      <a href={makePathById(item.id)} onClick={handleClick}>
        {item.source}
      </a>
    </li>
  );
};

export const Breadcrumb = ({ id, map, dispatch }: Props) => {
  const zoom = (id: Id) => {
    dispatch(actions.zoom(id));
  };
  const path = getPath(map, id).map((item, key) => <BreadcrumbItem item={item} key={key} zoom={zoom} />);
  if (path.size === 1) {
    return null;
  }
  return <ol>{path}</ol>;
};
