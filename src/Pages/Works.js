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
import Loading from '../Components/Loading.js';

export default function Works(props) {
	let [ currentRecords, setRecords ] = useState([]);

	const contextQuizzes = React.useContext(QuizzesContext);
	let { currentQuizzes } = contextQuizzes;

	const contextUser = React.useContext(UserContext);
	const { currentUser } = contextUser;

	let [currentRender, setRender] = useState(false);
	let [init, setInit] = useState(false);
	let [wait, setWait] = useState(true);

	//console.log(currentQuizzes);

	const initialize = useCallback(
		async function() {
			document.title = "Your Works";
	
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
	
			let filteredWorks = [];
			let workedQuizzesIndex = [];
			let quizzes = [];
			let allWorks = [];
	
			await props.fetchData('works/').then((res) => {
				allWorks = Object.values(res);
	
				//console.log(allWorks);
				for(let i = 0; i < allWorks.length; i++) {
					if(allWorks[i].owner === currentUser.uid) {
						filteredWorks.push(allWorks[i]);
						if(!workedQuizzesIndex.includes(allWorks[i].associatedQuiz)) {
							workedQuizzesIndex.push(allWorks[i].associatedQuiz);
						}
					}
				}
			});
	
			for(let i = 0; i < workedQuizzesIndex.length; i++) {
				const idx = workedQuizzesIndex[i];
				await props.fetchData(`quiz/${idx}`).then((res) => {
					quizzes[idx] = res;
				});
			}
	
			let filteredRecords = [];
	
			for(let i = 0; i < filteredWorks.length; i++) {
				
				const idx = filteredWorks[i].associatedQuiz;
				const score = filteredWorks[i].score;
				const maxScore = filteredWorks[i].maxScore;
				//console.log(quizzes);
				//console.log(idx);
				let record = {
					name: (quizzes[idx] === null) ? "Deleted Quiz" : quizzes[idx].name,
					timeSubmit: filteredWorks[i].timeSubmit,
					timeStart: filteredWorks[i].timeStart,
					score: score,
					maxScore: maxScore,
					percentage: Math.floor(10000*score/maxScore)/100,
					absoluteIndex: filteredWorks[i].absoluteIndex,
					associatedQuiz: idx,
					deletedQuiz: (quizzes[idx] === null) ? true : false
				};
				filteredRecords = [...filteredRecords, record];
				setRecords(filteredRecords);
			}
	
			setRender(true);
		}, [currentRender, currentUser, init, props, wait]
	);
	

	useEffect(() => {
		initialize();
	}, [ currentUser, wait, initialize ]);

	const listQuizzes = currentRecords.map((record) =>
		<div className={"quiz-card " + ((record.deletedQuiz) ? " wrong-choice" : "") } key={'Record' + record.absoluteIndex}>
			<span className="quiz-card-name">{record.name}</span>
			<span className="quiz-card-description">{record.timeSubmit}</span>
			<span className="quiz-card-questions">{record.score}</span>
			<span className="quiz-card-score">{record.maxScore}</span>
			<span className="quiz-card-time">{record.percentage} %</span>
			<div className="quiz-card-buttons">
				{(record.deletedQuiz) ? 
					(
						<Button text="Review" disabled/>
					)
					:
					(
						<Link
							to={{
								pathname: "/review/" + record.absoluteIndex
							}}>
							<Button text="Review"/>
						</Link>
					)
				}
			</div>
		</div>
	);
			

	const headerQuizzes = (
		<div className="quiz-top">
			<span className="quiz-card-name">Name</span>
			<span className="quiz-card-description">Completed At</span>
			<span className="quiz-card-questions">Your Points</span>
			<span className="quiz-card-score">Max Points</span>
			<span className="quiz-card-time">Percentage</span>
			<div className="quiz-card-buttons">
			</div>
		</div>	
	);

	const addQuiz = (
		<div id="add-quiz">
			<span id="add-quiz-chevron">&gt;&nbsp;</span>
			<span>That's all the quizzes you have done. Maybe do some more?</span>
		</div>	
	);

	if(currentRender === false) {
		return (
			<Loading />
		);
	} else {
		return (
			<>
				<h1>Your Works</h1>
				<div id="quizzes">
					{headerQuizzes}
					{listQuizzes}
					{addQuiz}
				</div>
			</>		
		);
	}
}