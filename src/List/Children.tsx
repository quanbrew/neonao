import * as React from 'react';
import { useEffect } from 'react';
import { Id, Item } from '../Item';
import ListNode from './ListNode';
import { List } from 'immutable';
import { useDispatch, useTree } from './List';
import { EditMode, getItem, loadItemState } from '../tree';
import { EDIT_MODE } from '../constants';
import { Dispatch } from '../App';

interface Props {
  item: Item;
  parentDragging: boolean;
}

const useLoadChildren = (item: Item, dispatch: Dispatch) => {
  const loadChildren = () => {
    if (!item.loaded) {
      loadItemState(item).then(dispatch);
    }
  };
  useEffect(loadChildren, [item.loaded]);
};

const NodeList = ({ items, parentDragging }: { items: List<Id>; parentDragging: boolean }) => {
  const tree = useTree();
  const editing = tree.mode.type === EDIT_MODE ? tree.mode.id : null;
  const mapper = (id: string) => {
    const item = getItem(tree.map, id);
    return (
      <ListNode
        key={id}
        id={id}
        item={item}
        parentDragging={parentDragging}
        editing={id === editing ? (tree.mode as EditMode) : null}
      />
    );
  };
  return <div className="children">{items.map(mapper)}</div>;
};

const DummyList = ({ length }: { length: number }) => {
  const dummyList = [...Array(length).keys()].map(key => <li key={key}>Loading...</li>);
  return <div className="children">{dummyList}</div>;
};

export const Children = React.memo(({ item, parentDragging }: Props) => {
  const dispatch = useDispatch();
  useLoadChildren(item, dispatch);
  if (item.children.size === 0 || !item.expand) {
    return null;
  } else if (item.loaded) {
    return <NodeList items={item.children} parentDragging={parentDragging} />;
  } else {
    return <DummyList length={item.children.size} />;
  }
});
