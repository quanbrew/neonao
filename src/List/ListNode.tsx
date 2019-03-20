import * as React from 'react';

import { ID, Item } from "../Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
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
import { EditorState } from 'draft-js';
import { dragMode, dropAt, DropPosition, loadItemState, normalMode, Tree } from "../tree";
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
} from "../actions";
import './ListNode.css';
import { DRAG_MODE, ITEM } from "../constants";
import { findDOMNode } from "react-dom";
import { Children } from "./Children";
import { Toolbar } from "./Toolbar";
import { DropLine } from "./DropLine";
import { ItemEditor } from "./ItemEditor";


export interface Props {
  id: ID;
  item: Item;
  dispatch: (action: ItemAction) => void;
  movePosition: DropPosition | null;
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


const sourceCollect: DragSourceCollector<SourceProps> = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};


const targetCollect: DropTargetCollector<TargetProps> = (connect, monitor) => {
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
  remove = () => this.props.dispatch(remove(this.props.id));

  render() {
    let classNames = ['ListNode'];
    const {
      isDragging, isOver, connectDragSource, movePosition, connectDropTarget, item,
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
        <ItemEditor onChange={ this.onChange } editor={ this.props.item.editor }/>
        <Toolbar up={ this.up } down={ this.down } left={ this.left }
                 right={ this.right } create={ this.create } remove={ this.remove }/>
        <Children items={ item.children } loaded={ item.loaded }/>
        { below }
      </div>
    );
  }
}


type StateProps = Pick<Props, 'item' | 'movePosition'>;

const mapStateToProps = (state: Tree, { id }: Props) => (state: Tree): StateProps => {
  const item = state.map.get(id) as Item;
  let movePosition: Props['movePosition'] = null;
  if (state.mode.type === DRAG_MODE && state.mode.dropAt && state.mode.dropAt.target === id)
    movePosition = state.mode.dropAt.position;
  return { item, movePosition };
};


type DispatchProps = Pick<Props, 'dispatch'>;

const mapDispatchToProps = (dispatch: Dispatch) => ({ dispatch });

const DragSourceListNode = DragSource<Props, SourceProps>(ITEM, nodeSource, sourceCollect)(RawListNode);
const DropTargetListNode = DropTarget<Props, TargetProps>(ITEM, nodeTarget, targetCollect)(DragSourceListNode);
const ListNode = connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(DropTargetListNode);
export default ListNode;
