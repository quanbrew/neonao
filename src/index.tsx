import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.scss';
import 'normalize.css';

const List = React.lazy(() =>
  import(/* webpackChunkName: "list_component" */
  './List/List')
);

const App = () => (
  <div>
    <header>
      <a className="app-name" href="/">
        NeoNao
      </a>
    </header>
    <React.Suspense fallback={<div>Loading Module...</div>}>
      <List />
    </React.Suspense>
  </div>
);

ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);
