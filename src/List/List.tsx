import * as React from 'react';
import Root from "./Root";

interface Props {
}

export class List extends React.PureComponent<Props> {
  render() {
    return <div className='list'><Root/></div>
  }
}
