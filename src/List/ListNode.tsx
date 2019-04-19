import React, { DragEventHandler, MouseEventHandler, useRef, useState } from 'react';

import { Id, Item } from '../Item';
import { dragMode, DropPosition, EditMode, normalMode } from '../state';
import * as actions from '../actions';
import './ListNode.scss';
import { Children } from './Children';
import { useDispatch, useView } from './List';
import { Editor } from './Editor';
import { Dispatch } from '../App';

const DRAGGING_CLASS = 'node-dragging';
const DROP_DATA_TYPE = 'text/list-node-id';

export interface Props {
  item: Item;
  editing: null | EditMode;
  parentDragging: boolean;
}

interface DragAndDrop {
  onDragStart: DragEventHandler;
  onDragEnd: DragEventHandler;
  onDrop: DragEventHandler;
  onDragOver: DragEventHandler;
  onDragLeave: DragEventHandler;
  dragging: boolean;
  isOver: DropPosition | null;
}

const getDropId = (e: React.DragEvent): Id => {
  return e.dataTransfer.getData(DROP_DATA_TYPE);
};

type Rect = ClientRect | DOMRect;

const computeDropPosition = (e: React.DragEvent, rect: Rect): DropPosition => {
  const y = e.clientY;

  const top = Math.abs(y - rect.top);
  const bottom = Math.abs(y - rect.bottom);
  return top > bottom ? 'below' : 'above';
};

const useDragAndDrop = (
  id: Id,
  dispatch: Dispatch,
  ref: React.RefObject<Element>,
  parentDragging: boolean
): DragAndDrop => {
  const [dragging, setDragging] = useState(false);
  const [isOver, setIsOver] = useState<DropPosition | null>(null);
  const ignoreOverCounter = useRef(5);
  const onDragStart: DragEventHandler = e => {
    e.dataTransfer.setData(DROP_DATA_TYPE, id);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(true);
    dispatch(actions.switchMode(dragMode()));
  };
  const onDragEnd: DragEventHandler = () => {
    setDragging(false);
    dispatch(actions.switchMode(normalMode()));
  };
  const canDrop = (e: React.DragEvent): boolean => {
    return e.dataTransfer.types.includes(DROP_DATA_TYPE) && !dragging && !parentDragging;
  };

  const onDrop: DragEventHandler = e => {
    setDragging(false);
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (canDrop(e)) {
      const dropId = getDropId(e);
      e.stopPropagation();
      if (dropId === id) return;
      e.preventDefault(); // accept drop
      setIsOver(null);
      dispatch(actions.drop(getDropId(e), id, computeDropPosition(e, rect)));
    }
    dispatch(actions.switchMode(normalMode()));
  };
  const onDragOver: DragEventHandler = e => {
    if (!ref.current) return;
    if (canDrop(e)) {
      e.preventDefault();
      e.stopPropagation();
      const rect = ref.current.getBoundingClientRect();
      const position = computeDropPosition(e, rect);
      if (position !== isOver) {
        setIsOver(position);
      }
    } else if (dragging || parentDragging) {
      e.stopPropagation();
    }
  };
  const onDragLeave: DragEventHandler = () => {
    if (isOver) {
      setIsOver(null);
    }
  };
  return { onDragEnd, onDragLeave, onDragOver, onDragStart, onDrop, isOver, dragging: dragging || parentDragging };
};

interface BulletProps {
  toggle: () => void;
  onDragStart: DragEventHandler;
  onDragEnd: DragEventHandler;
}

const Bullet = ({ onDragStart, onDragEnd, toggle }: BulletProps) => {
  const handleClick: MouseEventHandler = e => {
    e.preventDefault();
    toggle();
  };
  return (
    <div className="bullet" draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={handleClick}>
      •
    </div>
  );
};

// const FoldLine = ({ id }: { id: Id }) => {
//   const dispatch = useDispatch();
//   const handleClick: React.MouseEventHandler = e => {
//     e.preventDefault();
//     dispatch(fold(id));
//   };
//   return (
//     <div className="toggle-line" onClick={handleClick}/>
//   );
// };

export interface Operator {
  swapUp: () => void;
  swapDown: () => void;
  unIndent: () => void;
  indent: () => void;
  create: () => void;
  remove: () => void;
  toggle: () => void;
  edit: () => void;
  zoom: () => void;
  gotoNext: () => void;
  gotoPrev: () => void;
  exitEdit: () => void;
}

const useOperate = (dispatch: Dispatch, item: Item, editing: EditMode | null): Operator => {
  const view = useView();
  const id = item.id;
  const parent = item.parent;
  const childCount = item.children.size;
  const swapUp = () => {
    if (parent) {
      dispatch(actions.reorder(id, -1));
    }
  };
  const swapDown = () => {
    if (parent) {
      dispatch(actions.reorder(id, 1));
    }
  };
  const unIndent = () => {
    if (parent) {
      dispatch(actions.unIndent(id, parent));
    }
  };
  const indent = () => {
    if (parent) {
      dispatch(actions.indent(id, parent));
    }
  };
  const create = () => {
    let action;
    if (item.children.size > 0) {
      action = actions.create(Item.create('', id));
    } else {
      action = actions.create(Item.create('', parent), id);
    }
    dispatch(action);
  };
  const remove = () => {
    if (childCount === 0) {
      dispatch(actions.remove(id));
    }
  };
  const toggle = () => {
    if (childCount > 0) {
      dispatch(actions.toggle(id));
    }
  };
  const edit = () => {
    if (!editing) {
      dispatch(actions.focus(id));
    }
  };
  const zoom = () => {
    dispatch(actions.setView({ ...view, root: id }));
  };
  const gotoNext = () => {
    dispatch(actions.gotoNext(id));
  };
  const gotoPrev = () => {
    dispatch(actions.gotoPrev(id));
  };
  const exitEdit = () => {
    dispatch(actions.switchMode(normalMode()));
  };
  return { swapUp, swapDown, unIndent, indent, remove, create, toggle, edit, gotoNext, gotoPrev, exitEdit, zoom };
};

export const ListNode = React.memo(({ item, parentDragging, editing }: Props) => {
  const { id, children, source, modified } = item;
  const dispatch = useDispatch();
  const onChange = (source: string) => dispatch(actions.edit(id, source));
  const operates = useOperate(dispatch, item, editing);

  const dropRef = useRef<HTMLDivElement>(null);
  const { onDrop, onDragStart, onDragOver, onDragLeave, onDragEnd, isOver, dragging } = useDragAndDrop(
    id,
    dispatch,
    dropRef,
    parentDragging
  );

  const classNames = ['ListNode'];
  if (dragging) {
    classNames.push(DRAGGING_CLASS);
  }
  if (parentDragging) {
    classNames.push('parent-dragging');
  }
  if (isOver !== null) {
    // drop-inner | drop-above | drop-below
    classNames.push(`drop-${isOver}`);
  }
  if (item.expand || children.size === 0) {
    classNames.push('expanded');
  } else {
    classNames.push('folded');
  }
  return (
    <div
      ref={dropRef}
      className={classNames.join(' ')}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <Bullet onDragStart={onDragStart} onDragEnd={onDragEnd} toggle={operates.toggle} />
      <Editor onChange={onChange} source={source} editing={!!editing} modified={modified} {...operates} />
      <Children item={item} parentDragging={dragging} />
    </div>
  );
});

export default ListNode;
