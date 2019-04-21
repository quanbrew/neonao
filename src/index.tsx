import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.scss';
import 'normalize.css';
import { App } from './App';

ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);

const MARKDOWN = '**hello**, [neonao](https://quanbrew.github.io/neonao/)';
import('neonao_parsers').then(parsers => console.log(parsers.markdown(MARKDOWN)));
