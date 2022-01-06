
/*
React Stuff
*/
import React, { useState, useEffect } from 'react';
import {
	Link
} from "react-router-dom";

/*
Imports from Other .js Files
*/
import Button from './Button.js';
import { checkUndefined } from '../Utility.js';
import { ToastContext } from '../App.js';
import { showModal } from './Modal.js';

/*
CSS Imports
*/
import '../css/QuizHeader.css';

function HeaderColumn(props) {
	return (
		<div className="header-column">
			<span className="material-icons-outlined">
				{ props.icon }
			</span>
			<span className={(props.caption) ? "header-column-number" : "header-column-text"}>
				{ (props.text) }
			</span>
			<span className="header-column-caption">
				{ checkUndefined(props.caption) }
			</span>
		</div>
	);
}

export function QuizHeader(props) {
	let quiz = props.quiz;
	let currentQuestions = props.currentQuestions;

	// Some variables taking the value of the props (and checking whether they're null or not to avoid errors).
	let quizName = (quiz) ? props.quiz.name : null;
	let quizQuestions = (currentQuestions) ? props.currentQuestions.length : null;
	let quizDuration = (quiz) ? parseInt(props.quiz.duration)*60*1000: null; //ms
	let quizTime = (currentQuestions) ? parseInt((props.duration)) : null; //should be in ms
	let [init, setInit] = useState(false);
	
	// Either "edit" (for quiz makers) or "work" (for students) mode.
	let [currentPercent, setPercent] = useState(0);
	let [warningCount, setWarningCount] = useState(0);
	const context = React.useContext(ToastContext);  

	let addToast = context.addToast;

	function getColor(currentPercent) {
		if(currentPercent >= 50) {
			return "#2ecc71";
		} else if(currentPercent >= 10) {
			return "#f1c40f";
		} else {
			return "#e74c3c";
		}
	}

	useEffect(() => {
		setPercent(Math.floor(props.duration*10000/quizDuration)/100);
		if(!init) {
			setInit(true);
			window.addEventListener('scroll', function(){ 
				let header = document.getElementById('header');
				let headercard = document.getElementById('header-card');
		
				if(headercard && header && headercard.getBoundingClientRect().top === 0) {
					header.className = "header-full";
				} else if(header) {
					header.className = "";
				}
			});
		}
		if(warningCount === 0 && currentPercent === 50) {
			addToast("error", "Time Notification", "Half the duration has passed!", 2);
			setWarningCount(1);
		}
		if(warningCount === 1 && currentPercent === 10) {
			addToast("error", "Not Much Time Left!", "You only have " +  Math.floor(props.duration/1000) + " seconds left!!", 2);
			setWarningCount(2);
		}
	}, [props.duration, quizDuration, init, warningCount, currentPercent, addToast]);

	function showQuizSettings() {
		showModal(props.quizSettings, 0.5);
	}

	switch(props.mode) {
		case "edit":
			return (
				<div id="header-card">
					<div>
						<Button startIcon="save" text="Save" variant="btn-info" trigger={props.saveQuiz()} disabled={(props.currentChange.length === 0)}/>
						<Button icon="settings" trigger={showQuizSettings}/>
						<Link to={`/results/${props.quiz.absoluteIndex}`}>
							<Button startIcon="school" text="Result"/>
						</Link>
					</div>
					<HeaderColumn icon="note_alt" text={ quizName }/>
					<HeaderColumn icon="quiz" text={ quizQuestions } caption="Questions"/>
					<HeaderColumn icon="timer" text={ quizDuration/(1000*60) } caption="Minute" />
					<HeaderColumn icon="grade" text={ props.currentScore } caption="Max Possible Points"/>
				</div>
			)
		case "review":
			return (
				<div id="header-card">
					<div>
						<Link to="/works">
							<Button startIcon="arrow_back_ios" text="Back"/>
						</Link>
					</div>
					<HeaderColumn icon="note_alt" text={ quizName }/>
					<HeaderColumn icon="quiz" text={ quizQuestions } caption="Questions"/>
					<HeaderColumn icon="timer" text={ quizDuration/(1000*60) } caption="Minute" />
					<HeaderColumn icon="grade" text={ `${props.earnedScore}/${props.currentScore}` } caption="Earned Points"/>
				</div>
			);
		case "work":
			return (
				<div id="header-card" 
					style={{
					borderBottom: 2 + "px solid",
					borderImageSlice: 1,
					borderWidth: 4 + "px",
					borderImageSource: 'linear-gradient(90deg, ' + getColor(currentPercent) + ' ' + (currentPercent - 1) + '%, rgba(57,62,70,1) ' +  (currentPercent) + '%, rgba(57,62,70,1) 100%)'
					}}>
					<div>
						<Button trigger={props.finalizeAnswers()} text="Finish"/>
					</div>
					<HeaderColumn icon="note_alt" text={ quizName }/>
					<HeaderColumn icon="quiz" text={ props.finished + "/" + props.currentQuestions.length } caption={" Completed"}/>
					<div>
						{(Math.floor((quizTime/1000)/60) === 0) ?
							(
								<HeaderColumn icon="timer" text={ Math.floor(quizTime/1000- 60*Math.floor((quizTime/1000)/60)) % 60 } caption="Second" />
							)
							:
							(
								<>
									<HeaderColumn icon="timer" text={ Math.floor((quizTime/1000)/60) } caption="Minute" />
									<HeaderColumn text={ Math.floor(quizTime/1000- 60*Math.floor((quizTime/1000)/60)) % 60 } caption="Second" />
								</>
							)
						}
						
						
					</div>
					<HeaderColumn icon="grade" text={ props.currentScore } caption="Max Possible Points"/>
				</div>
			)
		default:
			return (
				<div>
				</div>
			);
	}
}