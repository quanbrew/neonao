import * as React from 'react';
import { useEffect } from 'react';
import { Id, Item } from '../Item';
import ListNode from './ListNode';
import { List } from 'immutable';
import { useDispatch, useTree } from './List';
import { EditMode, getItem, getUnloadItemId, loadItemState } from '../tree';
import { EDIT_MODE } from '../constants';
import { Dispatch } from '../App';

interface Props {
  item: Item;
  parentDragging: boolean;
}

const useLoadChildren = (item: Item, dispatch: Dispatch): boolean => {
  const tree = useTree();
  const unloadItems = getUnloadItemId(tree.map, item.children);
  const loadChildren = () => {
    if (unloadItems.size > 0) {
      loadItemState(item).then(dispatch);
    }
  };
  useEffect(loadChildren, [unloadItems.size]);
  return unloadItems.size === 0;
};

const NodeList = ({ items, parentDragging }: { items: List<Id>; parentDragging: boolean }) => {
  const tree = useTree();
  const editing = tree.mode.type === EDIT_MODE ? tree.mode.id : null;
  const mapper = (id: string) => {
    const item = getItem(tree.map, id);
    return (
      <ListNode
        key={id}
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
  const loaded = useLoadChildren(item, dispatch);
  if (item.children.size === 0 || !item.expand) {
    return null;
  } else if (loaded) {
    return <NodeList items={item.children} parentDragging={parentDragging} />;
  } else {
    return <DummyList length={item.children.size} />;
  }
});
