import 'react-app-polyfill/ie11';
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import JavascriptTimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

JavascriptTimeAgo.locale(en);
ReactDOM.render(<App />, document.getElementById("root") as HTMLElement);
