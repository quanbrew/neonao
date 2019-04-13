import * as React from 'react';
import { ID } from '../Item';
import ListNode from './ListNode';
import { List } from 'immutable';
import { useTree } from './List';
import { EditMode, getItem } from '../tree';
import { EDIT_MODE } from '../constants';

interface Props {
  items: List<ID>;
  loaded: boolean;
  expand: boolean;
  parentDragging: boolean;
}

const NodeList = ({ items, parentDragging }: Pick<Props, 'items' | 'parentDragging'>) => {
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

export const Children = React.memo(({ items, loaded, expand, parentDragging }: Props) => {
  if (items.size === 0 || !expand) {
    return null;
  } else if (loaded) {
    return <NodeList items={items} parentDragging={parentDragging} />;
  } else {
    return <DummyList length={items.size} />;
  }
});
