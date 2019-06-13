import React from 'react';
import { Id, Item } from '../Item';
import { Children } from './Children';
import * as actions from '../actions';
import { gotoNext } from '../actions';
import { useDispatch, useView } from './List';
import { Editor } from './Editor';
import { Mode, normalMode } from '../state';
import { EDIT_MODE } from '../constants';
import './Root.scss';
import { onChange } from './ListNode';

interface Props {
  root: Item;
  mode: Mode;
  realRoot: Id;
}

const empty = () => {
  // empty function
};

const Root = ({ realRoot, root, mode }: Props) => {
  const dispatch = useDispatch();
  const view = useView();
  const editing = mode.type === EDIT_MODE && mode.id === root.id && view.id === mode.view;
  const edit = (selection?: Selection) => {
    const anchor = selection ? selection.anchorOffset : 0;
    const focus = selection ? selection.focusOffset : 0;
    dispatch(actions.focus(root.id, view.id, focus, anchor));
  };
  const exitEdit = () => {
    dispatch(actions.switchMode(normalMode()));
  };
  const create = () => {
    const newItem = Item.create('', root.id);
    dispatch(actions.create(newItem));
    dispatch(actions.focus(newItem.id, view.id, 0));
  };
  const goNext = () => {
    dispatch(gotoNext(root.id, view.id));
  };

  const editor = (
    <Editor
      onChange={onChange(dispatch, root.id)}
      source={root.source}
      editing={editing}
      modified={root.modified}
      swapUp={empty}
      swapDown={empty}
      unIndent={empty}
      indent={empty}
      create={create}
      remove={empty}
      toggle={empty}
      edit={edit}
      gotoNext={goNext}
      gotoPrev={empty}
      exitEdit={exitEdit}
      zoom={empty}
      last={root.children.size === 0}
    />
  );

  return (
    <div className="Root">
      {realRoot === root.id ? null : editor}
      <Children item={root} parentDragging={false} />
    </div>
  );
};

export default Root;
