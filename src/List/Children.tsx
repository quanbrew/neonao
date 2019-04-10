import * as React from 'react';
import { ID } from '../Item';
import ListNode from './ListNode';
import { List } from 'immutable';

interface Props {
  items: List<ID>;
  loaded: boolean;
  expand: boolean;
  parentDragging: boolean;
}

const dummy = (length: number) => {
  const dummyList = [];
  for (let i = 0; i < length; i++) {
    dummyList.push(<li key={i}>Loading...</li>);
  }
  return dummyList;
};

export class Children extends React.PureComponent<Props> {
  // shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
  //   const { items, loaded, expand, parentDragging } = this.props;
  //   return (
  //     loaded !== nextProps.loaded ||
  //     expand !== nextProps.expand ||
  //     !items.equals(nextProps.items) ||
  //     parentDragging !== nextProps.parentDragging
  //   );
  // }

  render() {
    const { items, loaded, expand, parentDragging } = this.props;
    if (items.size === 0 || !expand) return null;
    const children = items.map((id: string) => <ListNode key={id} id={id} parentDragging={parentDragging} />);
    return <div className="children">{loaded ? children : dummy(items.size)}</div>;
  }
}
