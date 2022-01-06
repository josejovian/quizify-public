/*
React Stuff
*/
import React, { useState, useEffect, useCallback } from 'react';
import {
	Link
} from "react-router-dom";

/*
Imports from Other .js Files
*/
import Button from '../Components/Button.js';
import { QuizzesContext, UserContext } from '../App.js';
import { showModalNotice, initializePage } from '../App.js';
import { useLocation } from 'react-router-dom/cjs/react-router-dom.min';
import Loading from '../Components/Loading.js';

export default function Works(props) {
	let [ currentRecords, setRecords ] = useState([]);
	let [ currentQuiz, setQuiz ] = useState(null);

	const contextQuizzes = React.useContext(QuizzesContext);
	let { currentQuizzes } = contextQuizzes;

	const contextUser = React.useContext(UserContext);
	const { currentUser, currentUsers } = contextUser;

	let [currentRender, setRender] = useState(false);
	let [init, setInit] = useState(false);
	let [wait, setWait] = useState(true);

	const loc = useLocation();

	//console.log(currentQuizzes);

	const initialize = useCallback(
		async function() {
			document.title = "All Works";
	
			// Wait for a moment, then check if user is logged in.
			if(wait === true && currentRender === false) {
				await initializePage();
				setWait(false)
				return;
			}
	
			if(wait === true && currentUser === 'null') {
				return;
			}
	
			if(wait === false && currentUser === 'null') {
				showModalNotice('GUEST_ACCESS');
				return;
			}
	
			// Authorization success.
			if(init || currentRender === true)
				return;
	
			setInit(true);
	
			let quizCode = loc.pathname.replace("/results/", "");	
	
			let quizWorks = [];
			let allWorks = [];
	
			await props.fetchData('works/').then((res) => {
				allWorks = Object.values(res);
	
				//console.log(allWorks);
				for(let i = 0; i < allWorks.length; i++) {
					if(allWorks[i].associatedQuiz === quizCode) {
						quizWorks.push(allWorks[i]);
					}
				}
			});
	
			let j = 0;
			//console.log(currentQuizzes);
			for(j = 0; j < currentQuizzes.length; j++) {
				if(parseInt(currentQuizzes[j].absoluteIndex) === parseInt(quizCode)) {
					//console.log(j);
					setQuiz(currentQuizzes[j]);
					break;
				}
			}
	
			let filteredRecords = [];
	
			for(let i = 0; i < allWorks.length; i++) {
				const idx = allWorks[i].associatedQuiz;
				const score = allWorks[i].score;
				const maxScore = allWorks[i].maxScore;
			
				let record = {
					name: currentUsers[allWorks[i].owner].name,
					timeSubmit: allWorks[i].timeSubmit,
					timeStart: allWorks[i].timeStart,
					score: score,
					maxScore: maxScore,
					percentage: Math.floor(10000*score/maxScore)/100,
					absoluteIndex: allWorks[i].absoluteIndex,
					associatedQuiz: idx
				};
				filteredRecords = [...filteredRecords, record];
				setRecords(filteredRecords);
				
			}
			setRender(true);
		}, [currentQuizzes, currentRender, currentUser, currentUsers, init, loc.pathname, props, wait]
	); 

	useEffect(() => {
		initialize();
	}, [ currentUser, wait, initialize ]);

	const listQuizzes = currentRecords.map((record) =>
		<div className="quiz-card" key={'Record' + record.absoluteIndex}>
			<span className="quiz-card-name">{record.name}</span>
			<span className="quiz-card-description">{record.timeSubmit}</span>
			<span className="quiz-card-questions">{record.score}</span>
			<span className="quiz-card-score">{record.maxScore}</span>
			<span className="quiz-card-time">{record.percentage} %</span>
			<div className="quiz-card-buttons">
				<Link
					to={{
						pathname: "/review/" + record.absoluteIndex
					}}
				>
					<Button text="Review"/>
				</Link>
			</div>
		</div>
	);
			

	const headerQuizzes = (
		<div className="quiz-top">
			<span className="quiz-card-name">Name</span>
			<span className="quiz-card-description">Completed At</span>
			<span className="quiz-card-questions">Points</span>
			<span className="quiz-card-score">Max Points</span>
			<span className="quiz-card-time">Percentage</span>
			<div className="quiz-card-buttons">
			</div>
		</div>	
	);

	if(currentRender === false) {
		return (
			<Loading />
		);
	} else {
		return (
			<>
				<h1>Quiz Results: {currentQuiz.name}</h1>
				<div id="quizzes">
					{headerQuizzes}
					{listQuizzes}
				</div>
			</>		
		);
	}
}