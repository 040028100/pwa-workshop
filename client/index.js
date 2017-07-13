/* eslint no-console:off */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './app';

import 'file-loader?name=web-app-manifest.json!./web-app-manifest.json';
import 'file-loader?name=./img/launcher-icon-1x.png!./img/launcher-icon-1x.png';
import 'file-loader?name=./img/launcher-icon-2x.png!./img/launcher-icon-2x.png';
import 'file-loader?name=./img/launcher-icon-4x.png!./img/launcher-icon-4x.png';

import { } from 'worker-loader?name=frontend-grocer-sw.js!./sw.js';

ReactDOM.render(<App />, document.getElementById('root'));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./frontend-grocer-sw.js')
    .then(() => {
      console.log('Service worker registered');
      return true;
    })
    .catch((err) => {
      console.warn('Service worker registration failed', err);
      // Service worker registration failed
    });
} else {
  console.info('Service worker not supported');
  // Service worker is not supported
}