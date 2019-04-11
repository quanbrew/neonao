import React, { DragEventHandler, useCallback, useEffect, useRef, useState } from 'react';

import { ID, Item } from '../Item';
import { EditorState } from 'draft-js';
import { dragMode, DropPosition, EditMode, editMode, loadItemState, normalMode } from '../tree';
import * as actions from '../actions';
import { unIndent } from '../actions';
import './ListNode.scss';
// import { EDIT_MODE } from '../constants';
import { Children } from './Children';
import { ItemEditor } from './ItemEditor';
import { emptyEditor } from '../editor';
import { Dispatch, useDispatch } from './List';

const DRAGGING_CLASS = 'node-dragging';
const DROP_DATA_TYPE = 'text/list-node-id';

export interface Props {
  id: ID;
  item: Item;
  editing: null | EditMode;
  parentDragging: boolean;
}

const useLoadChildren = (item: Item, dispatch: Dispatch) => {
  const init = useRef(true);
  useEffect(() => {
    if (init.current) {
      init.current = false;
      if (!item.loaded) loadItemState(item).then(dispatch);
    }
  });
};

interface DragAndDrop {
  onDragStart: DragEventHandler;
  onDragEnd: DragEventHandler;
  onDrop: DragEventHandler;
  onDragOver: DragEventHandler;
  onDragLeave: DragEventHandler;
  dragging: boolean;
  isOver: DropPosition | null;
}

const getDropId = (e: React.DragEvent): ID => {
  return e.dataTransfer.getData(DROP_DATA_TYPE);
};

const computeDropPosition = (e: React.DragEvent, elem: Element): DropPosition => {
  const y = e.clientY;
  const rect = elem.getBoundingClientRect();

  const top = Math.abs(y - rect.top);
  const bottom = Math.abs(y - rect.bottom);
  return top > bottom ? 'below' : 'above';
};

type ContentRef = React.RefObject<HTMLDivElement>;

const useDragAndDrop = (id: ID, dispatch: Dispatch, contentRef: ContentRef, parentDragging: boolean): DragAndDrop => {
  const [dragging, setDragging] = useState(false);
  const [isOver, setIsOver] = useState<DropPosition | null>(null);
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
    if (canDrop(e) && contentRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setIsOver(null);
      dispatch(actions.drop(getDropId(e), id, computeDropPosition(e, contentRef.current)));
    }
    dispatch(actions.switchMode(normalMode()));
  };
  const onDragOver: DragEventHandler = e => {
    if (canDrop(e) && contentRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const position = computeDropPosition(e, contentRef.current);
      if (position !== isOver) {
        setIsOver(position);
      }
    }
  };
  const onDragLeave: DragEventHandler = () => {
    if (isOver) {
      setIsOver(null);
    }
  };
  return { onDragEnd, onDragLeave, onDragOver, onDragStart, onDrop, isOver, dragging: dragging || parentDragging };
};

export interface EditOperator {
  up: () => void;
  down: () => void;
  left: () => void;
  right: () => void;
  create: () => void;
  remove: () => void;
  toggle: () => void;
  edit: () => void;
}

const useEditOperate = (dispatch: Dispatch, item: Item, editing: EditMode | null): EditOperator => {
  const id = item.id;
  const parent = item.parent;
  const childCount = item.children.size;
  const up = useCallback(() => {
    if (parent) {
      dispatch(actions.reorder(id, -1));
    }
  }, [parent]);
  const down = useCallback(() => {
    if (parent) {
      dispatch(actions.reorder(id, 1));
    }
  }, [parent]);
  const left = useCallback(() => {
    if (parent) {
      dispatch(unIndent(id, parent));
    }
  }, [parent]);
  const right = useCallback(() => {
    if (parent) {
      dispatch(actions.indent(id, parent));
    }
  }, [parent]);
  const create = useCallback(() => {
    dispatch(actions.create(Item.create(emptyEditor, parent)));
  }, [parent]);
  const remove = useCallback(() => {
    if (childCount === 0) {
      dispatch(actions.remove(id));
    }
  }, [childCount]);
  const toggle = useCallback(() => {
    if (childCount > 0) {
      dispatch(actions.toggle(id));
    }
  }, [childCount]);
  const edit = useCallback(() => {
    if (!editing) {
      dispatch(actions.switchMode(editMode(id)));
    }
  }, [editing]);
  return { up, down, left, right, remove, create, toggle, edit };
};

export const ListNode = ({ item, id, parentDragging, editing }: Props) => {
  const dispatch = useDispatch();
  useLoadChildren(item, dispatch);
  const onChange = useCallback((editor: EditorState) => dispatch(actions.edit(item.id, editor)), [item]);
  const operates = useEditOperate(dispatch, item, editing);

  const contentRef = useRef<HTMLDivElement>(null);
  const { onDrop, onDragStart, onDragOver, onDragLeave, onDragEnd, isOver, dragging } = useDragAndDrop(
    id,
    dispatch,
    contentRef,
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
  return (
    <div className={classNames.join(' ')} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
      <div className="bullet" draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        •
      </div>
      <div ref={contentRef}>
        <ItemEditor onChange={onChange} editor={item.editor} editing={!!editing} {...operates} />
      </div>
      <Children items={item.children} loaded={item.loaded} expand={item.expand} parentDragging={dragging} />
    </div>
  );
};

export default ListNode;
