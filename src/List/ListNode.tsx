import React, { DragEventHandler, useCallback, useEffect, useRef, useState } from 'react';

import { ID, Item } from '../Item';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { EditorState } from 'draft-js';
import { dragMode, DropPosition, EditMode, editMode, loadItemState, normalMode, Tree } from '../tree';
import * as actions from '../actions';
import './ListNode.scss';
import { EDIT_MODE } from '../constants';
import { Children } from './Children';
import { ItemEditor } from './ItemEditor';
import { emptyEditor } from '../editor';

const DRAGGING_CLASS = 'node-dragging';
const DROP_DATA_TYPE = 'text/list-node-id';

export interface Props {
  id: ID;
  item: Item;
  dispatch: Dispatch;
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
      dispatch(actions.applyDrop(getDropId(e), id, computeDropPosition(e, contentRef.current)));
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

export const ListNode = ({ item, dispatch, editing, id, parentDragging }: Props) => {
  useLoadChildren(item, dispatch);
  const onChange = useCallback((editor: EditorState) => dispatch(actions.edit(item.id, editor)), [item, dispatch]);
  const up = useCallback(() => {
    if (item.parent) {
      dispatch(actions.relativeMove(item.id, item.parent, -1));
    }
  }, [item, dispatch]);
  const down = useCallback(() => {
    if (item.parent) {
      dispatch(actions.relativeMove(item.id, item.parent, 1));
    }
  }, [item, dispatch]);
  const left = useCallback(() => {
    if (item.parent) {
      dispatch(actions.moveNear(item.id, item.parent, item.parent, 1));
    }
  }, [item, dispatch]);
  const right = useCallback(() => {
    if (item.parent) {
      dispatch(actions.addIndent(item.id, item.parent));
    }
  }, [item, dispatch]);
  const create = useCallback(() => {
    dispatch(actions.create(Item.create(emptyEditor, item.parent)));
  }, [item, dispatch]);
  const remove = useCallback(() => {
    if (item.children.size === 0) {
      dispatch(actions.remove(id));
    }
  }, [item, dispatch]);
  const toggle = useCallback(() => {
    if (item.children.size > 0) {
      dispatch(actions.toggle(id));
    }
  }, [item, dispatch]);
  const startEdit = useCallback(() => {
    if (!editing) {
      dispatch(actions.switchMode(editMode(id)));
    }
  }, [dispatch, editing]);

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
      <div onClick={startEdit} ref={contentRef}>
        <ItemEditor
          onChange={onChange}
          editor={item.editor}
          editing={!!editing}
          up={up}
          down={down}
          left={left}
          right={right}
          toggle={toggle}
          create={create}
          remove={remove}
        />
      </div>
      <Children items={item.children} loaded={item.loaded} expand={item.expand} parentDragging={dragging} />
    </div>
  );
};

type StateProps = Pick<Props, 'item' | 'editing'>;

const mapStateToProps = (initState: Tree, { id }: Props) => ({ map, mode }: Tree): StateProps => {
  const item = map.get(id) as Item;
  let editing = null;
  if (mode.type === EDIT_MODE && mode.id === id) {
    editing = mode;
  }
  return { item, editing };
};

type DispatchProps = Pick<Props, 'dispatch'>;

const mapDispatchToProps = (dispatch: Dispatch) => ({ dispatch });

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ListNode);
