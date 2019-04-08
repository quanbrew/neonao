import * as React from 'react';

import {ID, Item} from "../Item";
import {Dispatch} from 'redux';
import {connect} from 'react-redux';
import {
  ConnectDragSource,
  ConnectDropTarget,
  DragSource,
  DragSourceCollector,
  DragSourceSpec,
  DropTarget,
  DropTargetCollector,
  DropTargetSpec
} from "react-dnd";
import {EditorState} from 'draft-js';
import {dragMode, dropAt, DropPosition, EditMode, editMode, loadItemState, normalMode, Tree} from "../tree";
import {
  addIndent,
  applyDrop,
  create,
  edit,
  ItemAction,
  moveNear,
  relativeMove,
  remove,
  switchMode,
  toggle,
} from "../actions";
import './ListNode.css';
import {DRAG_MODE, EDIT_MODE, ITEM} from "../constants";
import {findDOMNode} from "react-dom";
import {Children} from "./Children";
import {DropLine} from "./DropLine";
import {ItemEditor} from "./ItemEditor";


export interface Props {
  id: ID;
  item: Item;
  dispatch: (action: ItemAction) => void;
  movePosition: DropPosition | null;
  editing: null | EditMode;
}


interface State {
}


interface SourceProps {
  isDragging: boolean;
  connectDragSource: ConnectDragSource;
}


interface TargetProps {
  connectDropTarget: ConnectDropTarget;
  canDrop: boolean;
  isOver: boolean;
}


const nodeSource: DragSourceSpec<Props, Item> = {
  beginDrag: ({ item, dispatch }) => {
    dispatch(switchMode(dragMode()));
    return item;
  },
  canDrag: ({ item }) => item.parent !== undefined,
  endDrag: (props, monitor) => {
    const draggingItem: Item = monitor.getItem();
    const { id, parent } = draggingItem;
    if (parent) props.dispatch(applyDrop(id, parent));
    props.dispatch(switchMode(normalMode()));
  },
};


const nodeTarget: DropTargetSpec<Props> = {
  hover: (props, monitor, component: RawListNode | null) => {
    if (!component || !props.item.parent) return;
    if (!monitor.isOver({ shallow: true })) return;

    const draggingItem: Item = monitor.getItem();
    if (draggingItem.id === props.item.id) return;

    // Determine rectangle on screen
    const hoverBoundingRect = (findDOMNode(component) as Element).getBoundingClientRect();

    // Get vertical middle
    const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
    const hoverMiddleY = hoverHeight / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    if (!clientOffset) return;

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;
    let position: DropPosition = 'inner';
    const margin = props.item.children.size === 0 ? 12 : 0;
    if (hoverClientY > hoverMiddleY + margin) {
      position = 'below';
    } else if (hoverClientY < hoverMiddleY - margin) {
      position = 'above';
    }
    if (position === props.movePosition) return;
    const mode = dragMode(dropAt(props.item.id, position));
    props.dispatch(switchMode(mode));
  },
};


const sourceCollect: DragSourceCollector<SourceProps, Props> = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};


const targetCollect: DropTargetCollector<TargetProps, Props> = (connect, monitor) => {
  const isOver = monitor.isOver({ shallow: true });
  return {
    connectDropTarget: connect.dropTarget(),
    isOver,
    canDrop: monitor.canDrop(),
  };
};


type RawListNodeProps = Props & SourceProps & TargetProps;

export class RawListNode extends React.PureComponent<RawListNodeProps, State> {
  constructor(props: RawListNodeProps) {
    super(props);
    this.state = {};
  }

  load = () => {
    const { item, dispatch } = this.props;
    if (!item.loaded)
      loadItemState(item).then(dispatch);
  };

  onChange = (editor: EditorState) => {
    const { item, dispatch } = this.props;
    dispatch(edit(item.id, editor));
  };

  componentDidMount() {
    this.load();
  }

  up = () => {
    const { dispatch, item } = this.props;
    if (item.parent) dispatch(relativeMove(item.id, item.parent, -1));
  };

  down = () => {
    const { dispatch, item } = this.props;
    if (item.parent) dispatch(relativeMove(item.id, item.parent, 1));
  };
  left = () => {
    const { dispatch, item } = this.props;
    if (item.parent) dispatch(moveNear(item.id, item.parent, item.parent, 1));
  };
  right = () => {
    const { dispatch, item } = this.props;
    if (item.parent) dispatch(addIndent(item.id, item.parent));
  };
  create = () => this.props.dispatch(create(Item.create('', this.props.id)));
  remove = () => {
    const { id, dispatch, item } = this.props;
    if (item.children.size === 0) dispatch(remove(id))
  };

  toggle = () => {
    const { id, dispatch, item } = this.props;
    if (item.children.size > 0) dispatch(toggle(id));
  };

  startEdit = () => {
    const { id, dispatch, editing } = this.props;
    if (!editing) {
      dispatch(switchMode(editMode(id)))
    }
  };

  render() {
    // console.debug(`RENDER ${this.props.id}`);
    let classNames = ['ListNode'];
    const {
      isDragging, isOver, connectDragSource, movePosition, connectDropTarget, item, editing
    } = this.props;
    const bullet = connectDragSource(<div className='bullet'>•</div>);

    if (isDragging) {
      classNames.push('dragging');
    }
    if (isOver && !isDragging) classNames.push('is-over');
    if (movePosition === 'inner') {
      classNames.push('drop-inner');
    }
    const above = movePosition === 'above' ? <DropLine/> : null;
    const below = movePosition === 'below' ? <DropLine/> : null;
    return connectDropTarget(
      <div className={ classNames.join(' ') }>
        { bullet }
        { above }
        { connectDragSource(<div className='bullet'>•</div>) }
        <div onClick={ this.startEdit }>
          <ItemEditor onChange={ this.onChange } editor={ item.editor } editing={ editing !== null }
                      up={ this.up } down={ this.down } left={ this.left } toggle={ this.toggle }
                      right={ this.right } create={ this.create } remove={ this.remove }/>
        </div>
        <Children items={ item.children } loaded={ item.loaded } expand={ this.props.item.expand }/>
        { below }
      </div>
    );
  }
}


type StateProps = Pick<Props, 'item' | 'movePosition' | 'editing'>;

const mapStateToProps = (initState: Tree, { id }: Props) => ({ map, mode }: Tree): StateProps => {
  const item = map.get(id) as Item;
  let movePosition: Props['movePosition'] = null;
  let editing = null;
  if (mode.type === DRAG_MODE && mode.dropAt && mode.dropAt.target === id) {
    movePosition = mode.dropAt.position;
  } else if (mode.type === EDIT_MODE && mode.id === id) {
    editing = mode;
  }
  return { item, movePosition, editing };
};


type DispatchProps = Pick<Props, 'dispatch'>;

const mapDispatchToProps = (dispatch: Dispatch) => ({ dispatch });

const DragSourceListNode = DragSource<Props, SourceProps>(ITEM, nodeSource, sourceCollect)(RawListNode);
const DropTargetListNode = DropTarget<Props, TargetProps>(ITEM, nodeTarget, targetCollect)(DragSourceListNode);
const ListNode = connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(DropTargetListNode);
export default ListNode;
