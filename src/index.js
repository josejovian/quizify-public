import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {
	HashRouter as Router
} from "react-router-dom";
ReactDOM.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

// var quill = new Quill('#editor-container', {
// 	modules: {
// 	toolbar: [
// 		['bold', 'italic', 'underline'],
// 		[{ 'list': 'ordered'}, { 'list': 'bullet' }],
// 		['image']
// 	]
// 	},
// 	placeholder: 'Compose an epic...',
// 	theme: 'snow'  // or 'bubble'
// });

// function ok(delta) {
// 	// var tempCont = document.createElement("div");
// 	// (new Quill(tempCont)).setContents(delta);
// 	console.log(document.querySelector(".ql-editor").innerHTML);
// }

// quill.on('editor-change', function(delta, source) {
// 	if (source == 'api') {
// 		console.log("An API call triggered this change.");
// 	} else if (source == 'user') {
// 		delta = quill.getContents();
// 		localStorage.setItem('delta', delta);
// 		console.log("jeff");
// 	}
// 	console.log(quill.getContents());
// 	ok(delta);
// });	


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
