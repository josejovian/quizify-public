/*
React Stuff
*/
import React, { useEffect } from 'react';

import "../css/Landing.css";

export default function Landing() {
	useEffect(() => {
		document.title = "Main Menu"; // Change Page Title.
	});
	return (
		<div id="landing">
			<h1>Welcome to Quizify.</h1>
			<p>Make, do and review quizzes.<br/>Sign up to gain access to the site's features.</p>
		</div>
	);
}