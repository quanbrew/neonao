import { Id } from '../Item';
import { ViewAction, Zoom } from '../actions';
import { ZOOM } from '../constants';
import { makePathById } from '../path';

const uuid1 = require('uuid/v1');

export type ViewId = string;

export interface View {
  root: Id | null;
  viewId: ViewId;
}

export const createView = (root: Id | null) => ({ root, viewId: uuid1() });

const handleZoom = (view: View, { id, push }: Zoom): View => {
  if (view.root === id) {
    return view;
  } else if (push) {
    window.history.pushState({}, 'NeoNao', makePathById(id));
  }
  return { ...view, root: id };
};

export const viewReducer = (view: View, action: ViewAction): View => {
  console.log(action);
  switch (action.type) {
    case ZOOM:
      return handleZoom(view, action);
    default:
      return view;
  }
};
