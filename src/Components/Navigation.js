/*
Router Stuff
*/
import React, { useState, useEffect, useCallback } from 'react';
import {
	Link
} from "react-router-dom";

import { initializePage } from '../App.js';

/*
CSS Imports
*/
import '../css/Navigation.css';

function DropDown(props) {

	const dropdown = props.dropdown.map((link, idx) => 
		<li key={props.element + '-' + idx}>
			{link}
		</li>
	);

	let element = props.element;
	return (
		<div className="nav-drop">
			<div className="nav-parent">
				{element}
				<span className="material-icons-outlined">
			 		keyboard_arrow_down
			 	</span>
			</div>
			<ul className="nav-drop-content">
				{dropdown}
			</ul>
		</div>
	);
}

export default function Navigation(props) {
	let links;
	let [currentRender, setRender] = useState(false);
	let [wait, setWait] = useState(true);

	const data = props.userData;

	const initialize = useCallback(
		async function() {
			if(wait === true && currentRender === false) {
				await initializePage();
				setWait(false);
				return;
			}
			setRender(true);
		},
		[ currentRender, wait ]
	);

	useEffect(() => {
		initialize();
	}, [ data, wait, initialize ]);

	if(data === null || data === 'null') {
		links = (
			<>
				<Link to="/">
					Home
				</Link>
				<button onClick={() => props.showRegisterForm()}>Register</button>
				<button onClick={() => props.showLoginForm()}>Login</button>
			</>
		);
	} else {
		links = (
			<>
				<Link to="/">
					Home
				</Link>
				<DropDown
					element={
						<button>Quiz</button>
					}
					dropdown={[
						<Link to="/collection">Your Quizzes</Link>,
						<Link to="/works">Your Works</Link>
					]}
				/>
				<DropDown
					element={
						<button>{data.name}</button>
					}
					dropdown={[
						<Link id="logout" to="/">
							<button onClick={() => props.logout()}>Logout</button>
						</Link>
					]}
				/>
			</>
		);
	}

	if(true) {
		return (
			<nav id="nav">
				<div id="nav-logo">
					Quizify
				</div>
				<div id="nav-links">
					{links}
				</div>
			</nav>
		);
	}
}