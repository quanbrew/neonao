import * as React from 'react';
import { useEffect } from 'react';
import { Id, Item } from '../Item';
import ListNode from './ListNode';
import { List } from 'immutable';
import { useDispatch, useTree } from './List';
import { EditMode, getItem, getUnloadItemId, loadItemState } from '../tree';
import { EDIT_MODE } from '../constants';
import { Dispatch } from '../App';
import './Children.scss';
import { fold } from '../actions';

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

const FoldLine = ({ id }: { id: Id }) => {
  const dispatch = useDispatch();
  const handleClick: React.MouseEventHandler = e => {
    e.preventDefault();
    dispatch(fold(id));
  };
  return (
    <a href="#" className="toggle-line" onClick={handleClick}>
      <div className="line" />
    </a>
  );
};

const NodeList = ({ id, items, parentDragging }: { id: Id; items: List<Id>; parentDragging: boolean }) => {
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
  return (
    <div className="NodeList">
      <FoldLine id={id} />
      {items.map(mapper)}
    </div>
  );
};

const DummyList = ({ length }: { length: number }) => {
  const dummyList = [...Array(length).keys()].map(key => <li key={key}>Loading...</li>);
  return <div className="DummyList">{dummyList}</div>;
};

export const Children = React.memo(({ item, parentDragging }: Props) => {
  const dispatch = useDispatch();
  const loaded = useLoadChildren(item, dispatch);
  if (item.children.size === 0 || !item.expand) {
    return null;
  }
  let list;
  if (loaded) {
    list = <NodeList id={item.id} items={item.children} parentDragging={parentDragging} />;
  } else {
    list = <DummyList length={item.children.size} />;
  }
  return <div className="Children">{list}</div>;
});
