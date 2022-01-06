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
import { QuizzesContext, UserContext } from '../App.js';
import { toQuiz } from '../Components/Question.js';
import { QuestionReviewList } from '../Components/Question.js';
import { calculateScore } from '../Utility.js';
import { closeModal } from '../Components/Modal.js';
import { Form } from '../Components/Input.js';
import { showModalNotice, initializePage } from '../App.js';
import Loading from '../Components/Loading.js';

/*
CSS Imports
*/
import '../css/Questions.css';
import '../css/QuizEditor.css';

/*
	********************
	QuizSettings Modal Component
	********************
*/
export function QuizSettings(props) {

	useEffect(() => {
		if(props.quiz !== null) {
			document.getElementById('quiz-name').value = props.quiz.name;
			document.getElementById('quiz-description').value = props.quiz.description;
			document.getElementById('quiz-duration').value = props.quiz.duration;
		}
	});

	// For some reason, the ToastContext doesn't work within <Form />
	// So it'd be easier to just give it a prop of Toast.

	// Helper function for the Quiz Setting modal.
	function updateQuiz() {
		function valueColumn(column) {
			let data = document.getElementById('quiz-' + column);
			return (data) ? data.value : null;	
		}

		if(document.getElementById("modal-background") === null)
			return;
		
		let tempQuiz = toQuiz(
			props.quiz.name,
			props.quiz.description,
			props.quiz.length,
			props.quiz.duration,
			props.quiz.absoluteIndex,
			props.quiz.questionCount,
			props.quiz.maxScore,
			props.quiz.owner,
			props.quiz.kid
		);

		tempQuiz.issueCount = props.quiz.issueCount;

		let updatedColumns = 0;

		if(tempQuiz.name !== valueColumn("name")) {
			tempQuiz.setName(valueColumn("name"));
			updatedColumns++;
		}
		if(parseInt(tempQuiz.duration) !== parseInt(valueColumn("duration"))) {
			tempQuiz.setDuration(parseInt(valueColumn("duration")));
			updatedColumns++;
		}
		if(tempQuiz.description !== valueColumn("description")) {
			tempQuiz.setDescription(valueColumn("description"));
			updatedColumns++;
		}

		// Ensures that only when a column is updated, the toast shows.
		if(updatedColumns > 0) {
			props.setQuiz(tempQuiz);
			props.updateQuiz(tempQuiz);
		}

		closeModal();
	}

	return (
		<>
			<h3>Quiz Settings</h3>
			<Form
				fields={
					`[ \
						{"name":"Quiz Name", "type":"text", "rule":"length5-32"}, \
						{"name":"Quiz Description", "type":"textarea", "rule":"length5-48"}, \
						{"name":"Quiz Duration", "type":"number", "rule":"value1-300"} \
					]`
				}
				prefilled={true}
				addToast={props.addToast}
				submitAction={updateQuiz}
				submitText="Save Settings"
			/>
		</>
	)
}

/*
	********************
	QuizEditor Component
	********************
*/
export default function QuizEditor(props) {

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

		loc.state.quiz is to handle the case when the user decides to access the direct link for edit/work on quiz.
	*/
	let [currentQuiz, setQuiz] = useState(null);
	let [currentScore, setScore] = useState(0);
	let [currentQuestions, setQuestions] = useState(null);
	let [currentRender, setRender] = useState(false);
	let [currentWork, setWork] = useState(null);
	/*
		To ensure init function is run only once, not every rerender.
	*/
	let [init, setInit] = useState(false);
	let [wait, setWait] = useState(true);

	/*
		Handle contexts from App.js.
	*/
	// const contextToast = React.useContext(ToastContext);  
	const contextQuizzes = React.useContext(QuizzesContext);  
	// let addToast = contextToast.addToast;
	let { currentQuizzes } = contextQuizzes;

	const contextUser = React.useContext(UserContext);
	const { currentUser, currentUsers } = contextUser;
	/*
		********************
		Initialize function, in case if the user directly uses link to edit a Quiz.
		********************
	*/
	const initialize = useCallback(
		async function() {
			// Wait for a moment, then check if user is logged in.
			document.title = "Quiz Review";
			
			if(wait === true && currentRender === false) {
				await initializePage();
				setWait(false);
				return;
			}
			//console.log("HUH??");
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
			// Fetch work data from databse
			let workCode = loc.pathname.replace("/review/", "");	
			let work = null;
	
			await props.fetchData(`/works/${workCode}`).then(result => {
				setWork(result);
				work = result;
			});
	
			if(work === null) {
				showModalNotice('NOT_FOUND');
				return;
			}
	
			let quizCode = work.associatedQuiz;	
	
			// Fetch data immediately from database
			await props.getQuizAndQuestions(quizCode).then(bundle => {
				////console.log("Results:");
				////console.log(bundle);
				setQuiz(bundle[0]);
				setQuestions(bundle[1]);
				setScore(calculateScore(bundle[1]));
				if(work.owner !== currentUser.uid) {
					showModalNotice('OWNER_MISMATCH');
					return;
				} else {
					setRender(true);
				}
			});
		}, [currentRender, currentUser, init, loc.pathname, props, wait]
	);


	useEffect(() => {
		// initialize();
	}, [ currentQuizzes ]);

	// Update the quiz data of parent components.
	useEffect(() => {
		// if(!(currentQuiz instanceof QuizPack) && currentQuiz !== null) {
		// 	setQuiz(new QuizPack(
		// 		currentQuiz.name,
		// 		currentQuiz.description,
		// 		currentQuiz.questions,
		// 		currentQuiz.duration
		// 	));
		// }
		// if(currentQuiz !== null) {
		// 	props.updateQuiz(currentIdx, currentQuiz);
		// }
	}, [ currentQuiz ]);

	// Update max possible score of the quiz.
	useEffect(() => {
		setScore(calculateScore(currentQuestions));
		let tempQuiz = currentQuiz;
		if(tempQuiz === null || tempQuiz === undefined)
			return;
		tempQuiz.maxScore = currentScore;
		setQuiz(tempQuiz);
	}, [ currentScore, currentQuestions, currentQuiz ]);

	// Update and show the questions.
	useEffect(() => {
		initialize();

		// ////console.log(currentQuestions);

		// let tempQuiz = currentQuiz;
		// if(tempQuiz instanceof QuizPack) {
		// 	tempQuiz.setQuestions(currentQuestions);
		// }
		// setQuiz(tempQuiz);
		
	}, [ currentQuestions, currentUser, wait, initialize ]);

	useEffect(() => {

		/*
			********************
			If Add Question button does not already exist, create it.
			While the button can be created by directly writing the element in the render method,
			For the sake of prettiness, the following function also includes adding some "invisible" blocks
			that will manipulate how the flex behaves.
			********************
		*/
		if(document.getElementById('add-question') !== undefined) {
			let padder = document.createElement('div');
			padder.className = "placeholder-card question-card no-opacity";
	
			while(document.getElementsByClassName('placeholder-card question-card')[0]) {
				let pad = document.getElementsByClassName('placeholder-card question-card')[0];
				pad.remove();
			}
	
			if(document.getElementById('questions') === null || !currentQuestions) {
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
	});

	if(currentRender === false) {
		return (
			<Loading />
		);
	} else {
		return (
			<div className="editor">
				<header id="header">
					<h1>Review {currentUsers[currentWork.owner].name}'s Work</h1>
					<QuizHeader 
						mode="review"
						quiz={currentQuiz}
						currentQuestions={currentQuestions}
						earnedScore={currentWork.score}
						currentScore={currentScore}/>
				</header>
				<div id="questions">
					<QuestionReviewList currentQuestions={currentQuestions} currentAnswers={currentWork.answers}/>
				</div>		
			</div>
		);
	}
	
}
