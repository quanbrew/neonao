import * as React from 'react';
import { ID } from "../Item";
import ListNode from "./ListNode";
import { List } from "immutable";

interface Props {
  items: List<ID>;
  loaded: boolean;
}


const dummy = (length: number) => {
  let dummyList = [];
  for (let i = 0; i < length; i++) {
    dummyList.push(<li key={ i }>Loading...</li>);
  }
  return dummyList;
};


export class Children extends React.Component<Props> {

  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    const { items, loaded } = this.props;
    return loaded !== nextProps.loaded || !items.equals(nextProps.items);
  }

  render() {
    const { items, loaded } = this.props;
    if (items.size === 0) return null;
    const children = items.map(id => <ListNode key={ id } id={ id }/>);
    return (
      <div className="children">
        { loaded ? children : dummy(items.size) }
      </div>
    );
  }
}
