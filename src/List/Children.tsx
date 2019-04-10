import * as React from 'react';
import { ID } from '../Item';
import ListNode from './ListNode';
import { List } from 'immutable';

interface Props {
  items: List<ID>;
  loaded: boolean;
  expand: boolean;
  parentDragging: boolean;
}

export const Children = ({ items, loaded, expand, parentDragging }: Props) => {
  if (items.size === 0 || !expand) {
    return null;
  } else if (loaded) {
    const mapper = (id: string) => <ListNode key={id} id={id} parentDragging={parentDragging} />;
    return <div className="children">{items.map(mapper)}</div>;
  } else {
    const dummyList = [...Array(items.size).keys()].map(key => <li key={key}>Loading...</li>);
    return <div className="children">{dummyList}</div>;
  }
};
