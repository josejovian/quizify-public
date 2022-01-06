/*
React Stuff
*/
import React, { useState, useEffect, useCallback } from 'react';
import {
	useLocation
} from "react-router-dom";

/*
Imports from Other .js Files
*/
import { QuizHeader } from '../Components/QuizHeader.js';
import { ToastContext, QuizzesContext, UserContext } from '../App.js';
import { QuestionWorkList } from '../Components/Question.js';
import { calculateScore } from '../Utility.js';
import { showModal, closeModal } from '../Components/Modal.js';
import { Form } from '../Components/Input.js';
import { showModalNotice, initializePage } from '../App.js';
import Loading from '../Components/Loading.js';

/*
CSS Imports
*/
import '../css/Modal.css';
import '../css/Questions.css';
import '../css/QuizWorker.css';

function QuizSubmitModal() {
	setTimeout(() => {
		window.location.href = "/";
	}, 3000);
	return (
		<>
			<h3>You're Done!</h3>
			<p>You will soon be redirected to main menu in 3 seconds. You can check your graded work in the <b>Quiz &gt; Your Works</b> menu.</p>
		</>
	)
}

function QuizFinalizeModal(props) {
	return (
		<>
			<h3>Submit Your Answers</h3>
			<Form
				fields={'[]'}
				disabled={false}
				addToast={props.addToast}
				submitAction={props.submitAnswers}
				submitIcon="edit"
				submitText="Submit"
				msgTop="Clicking Submit here means that you are ready for your answers to be checked and marked."
			/>
		</>
	)
}

/*
	********************
	QuizSettings Modal Component
	********************
*/
function QuizPreparationModal(props) {	
	function startQuiz() {
		closeModal();
		props.startQuiz();
	}

	useEffect(() => {
		if (
			props.quiz !== null
			&& document.getElementById('quiz-name') !== null
			&& document.getElementById('quiz-description') !== null
			&& document.getElementById('quiz-duration') !== null
			) {
			document.getElementById('quiz-name').value = props.quiz.name;
			document.getElementById('quiz-description').value = props.quiz.description;
			document.getElementById('quiz-duration').value = props.quiz.duration;
		}
	});

	return (
		<>
			<h3>Quiz Preparation</h3>
			<Form
				fields={
					'[ \
						{"name":"Quiz Name", "type":"text", "rule":"length5-32"}, \
						{"name":"Quiz Description", "type":"textarea", "rule":"length5-48"}, \
						{"name":"Quiz Duration", "type":"number", "rule":"value1-300"} \
					]'
				}
				disabled={true}
				addToast={props.addToast}
				submitAction={startQuiz}
				submitIcon="edit"
				submitText="Start"
				msgTop="You are about to do the following quiz:"
				msgBottom="Since the timer starts once you click <b>Start Quiz</b>, please be prepared. Close this tab immediately, if this is NOT the quiz you want to take."
			/>
		</>
	)
}

/*
	********************
	QuizEditor Component
	********************
*/

export default function QuizWorker(props) {

	/*
		For shorter useLocation().
	*/
	let loc = useLocation();

	/*
		All states variable.
		Some variables may be included in one another (e.g. questions are in quiz),
		but for the sake of convenience, they will be split for now.
		 
		If a question is updated, the updates are temporarily stored in the currentQuestions, etc,
		and then, a regular update will be performed to save these updates on the quiz object.
	*/
	let [currentQuiz, setQuiz] = useState((loc.state !== undefined) ? loc.state.quiz : null);
	
	let [currentScore, setScore] = useState(0);
	let [currentQuestions, setQuestions] = useState((loc.state !== undefined) ? loc.state.quiz.questions : null);
	let [init, setInit] = useState(false);

	let [currentFinished, setFinished] = useState(0); //currentFinished questions
	let [currentTime, setTime] = useState(0); //remaining currentTime
	let [currentRender, setRender] = useState(false); //avoid inspect element cheating pre-quiz
	let [currentAnswers, setAnswers] = useState([]); //answer sheet
	let [currentStart, setStart] = useState(null);
	let [wait, setWait] = useState(true);

	/*
		To handle "importing" contexts from App.js.
	*/
	const contextToast = React.useContext(ToastContext);  
	const contextQuizzes = React.useContext(QuizzesContext);  
	let addToast = contextToast.addToast;
	let { currentQuizzes } = contextQuizzes;

	const contextUser = React.useContext(UserContext);
	const { currentUser } = contextUser;
	/*
		********************
		Initialize function, in case if the user directly uses link to edit a Quiz.
		********************
	*/
	const initialize = useCallback(
		async function() {
			if(document.getElementById('nav'))
				document.getElementById('nav').style.display = 'none';
	
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
	
			if(currentQuizzes === null)
				return;
	
			// Get link, then get the quiz code (based on the link).
			let quizCode = loc.pathname.replace("/work/", "");	
	
			// Fetch data immediately from database
			await props.getQuizAndQuestions(quizCode).then(bundle => {
				////console.log("Results:");
				if(bundle[0] === null) {
					showModalNotice('NOT_FOUND');
					return;
				}
				//console.log(bundle);
				setQuiz(bundle[0]);
				setQuestions(bundle[1]);
				setScore(calculateScore(bundle[1]));
				// setRender(true);
				showModal(
					<QuizPreparationModal quiz={bundle[0]} startQuiz={startQuiz}/>
				, 1);
				setStart(new Date().toLocaleString());
				setScore(calculateScore(bundle[1]));
				setTime(parseInt(bundle[0].duration) * 60 * 1000); //centiseconds
			}).catch(e => {
				//console.log(e);
			});
			
			let blankSheet = [];
			for(let i = 0; i < currentQuestions && currentQuestions.length; i++) {
				blankSheet[i] = null;
			}
		}, [currentQuestions, currentQuizzes, currentRender, currentUser, init, loc.pathname, props, wait]
	);


	const submitAnswers = useCallback(
		function() {
			setRender(false);

			let earnedPoints = 0;
			// let correctAnswers = 0;

			function correct(points) {
				// correctAnswers++;
				earnedPoints += points;
			}

			for(let i = 0; i < currentQuestions.length; i++) {
				switch(currentQuestions[i].type) {
					case "Multiple Choice":
						if(currentQuestions[i].correct === currentAnswers[i])
							correct(currentQuestions[i].score);
						break;
					default:
						if(currentQuestions[i].accept === currentAnswers[i])
							correct(currentQuestions[i].score);
						break;
				}
			}

			props.submitAnswers(currentQuiz.absoluteIndex, currentQuestions.length, currentAnswers, earnedPoints, currentQuiz.maxScore, currentStart);

			showModal(
				<QuizSubmitModal />
			,1);
		}, [currentAnswers, currentQuestions, currentQuiz, currentStart, props]
	);

	useEffect(() => {
		if(currentRender === true) {
			function count() {
				setTimeout(() => {
					if(currentTime === 0) {
						submitAnswers();
					}
					setTime(Math.max(currentTime - 100, 0));
				}, 100);
			}
			count();
		}
	}, [ currentRender, currentTime, submitAnswers ]);

	useEffect(() => {
		initialize();
	}, [ currentUser, wait, initialize ])

	useEffect(() => {
		// Run initilization functions defined previously.
		if(!init) initialize();

		/*
			********************
			If Add Question button does not already exist, create it.
			While the button can be created by directly writing the element in the currentRender method,
			For the sake of prettiness, the following function also includes adding some "invisible" blocks
			that will manipulate how the flex behaves.
			********************
		*/
		if(document.getElementById('add-question') !== undefined && currentQuestions !== null) {
			let padder = document.createElement('div');
			padder.className = "placeholder-card question-card no-opacity";
	
			while(document.getElementsByClassName('placeholder-card question-card')[0]) {
				let pad = document.getElementsByClassName('placeholder-card question-card')[0];
				pad.remove();
			}
	
			if(document.getElementById('questions') === null) {
				return;
			}

			if((3 - currentQuestions.length % 3) === 2) {
				document.getElementById('questions').appendChild(padder);
				document.getElementById('questions').appendChild(padder);
			} else if((3 - currentQuestions.length % 3) === 1) {
				document.getElementById('questions').appendChild(padder);
			} else {
				document.getElementById('questions').appendChild(padder);
				document.getElementById('questions').appendChild(padder);
				document.getElementById('questions').appendChild(padder);
			}
		}
	}, [currentQuestions, init, initialize]);

	/*
		********************
		Start Quiz:
		Immediately toggles currentRender, which renders all quiz components.
		********************
	*/
	function startQuiz() {
		setRender(true);
	}

	/*
		********************
		Helper function to relay user's answer to the variable that stores user's currentAnswers.
		********************
	*/
	function setAnswerPrepare(idx, ans) {

		let temp = currentAnswers;
		temp[idx - 1] = ans;
		setAnswers(temp);
		setFinished(temp.filter(value => {
			return (value !== null && value !== undefined)
		}).length);
	}

	function finalizeAnswers() {
		showModal(
			<QuizFinalizeModal addToast={addToast} submitAnswers={submitAnswers}/>
		, 1);
	}

	if(currentRender === false) {
		return (
			<Loading />
		);
	} else {
		return (
			<div className="editor">
				<header id="header">
					<h1>Do Quiz</h1>
					<QuizHeader mode="work"
						quiz={currentQuiz}
						currentQuestions={currentQuestions}
						finished={currentFinished}
						duration={currentTime}
						currentScore={currentScore}
						finalizeAnswers={() => finalizeAnswers}/>
				</header>
				<div id="questions">
					<QuestionWorkList currentQuestions={currentQuestions} setAnswers={setAnswerPrepare}/>
				</div>		
			</div>
		);
	}
}
