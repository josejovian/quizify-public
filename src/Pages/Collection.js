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
import { ToastContext, QuizzesContext, UserContext } from '../App.js';
import { showModal, closeModal } from '../Components/Modal.js';
import { Form } from '../Components/Input.js';
import { showModalNotice, initializePage } from '../App.js';
import Loading from '../Components/Loading.js';

export default function Collection(props) {

	const contextQuizzes = React.useContext(QuizzesContext);
	let currentQuizzes = contextQuizzes.currentQuizzes;

	const contextToast = React.useContext(ToastContext);  
	let addToast = contextToast.addToast;

	const contextUser = React.useContext(UserContext);
	const { currentUser, currentUsers, currentUserData } = contextUser;
	const QUIZ_PER_USER_LIMIT = contextUser.QUIZ_PER_USER_LIMIT;

	let [currentPrintedQuiz, setPrintedQuiz] = useState([]);
	let [currentRender, setRender] = useState(false);
	let [init, setInit] = useState(0);
	let [wait, setWait] = useState(true);

	const initialize = useCallback(
		async function() {
			
			//console.log(currentPrintedQuiz);
			// Wait for a moment, then check if user is logged in.
			if(props.mode === "private") {
				document.title = "Your Quizzes";

				if(wait === true && currentRender === false) {
					await initializePage();
					setWait(false);
					return;
				}
				if(wait === true && currentUser === 'null') {
					return;
				}
				if(wait === false && currentUser === 'null') {
					showModalNotice('GUEST_ACCESS');
					return;
				}
			} else {
				document.title = "All Quizzes";
			}
			let product = [];
			
			for(let i = 0; i < currentQuizzes.length; i++) {
				if(props.mode === "public" || (props.mode === "private" && currentQuizzes[i].owner === currentUser.uid)) {
					product = [...product, currentQuizzes[i]];
				}
				setPrintedQuiz(product);
			}
			//console.log(product);
			setPrintedQuiz(product);
		
			closeModal();
			setRender(true);
			setInit(init + 1);
			//console.log("Finish");
		}, [currentPrintedQuiz, currentQuizzes, currentRender, currentUser, props.mode, wait, init]
	);
	
	const getAuthors = useCallback(
		async function() {
			let temp = currentPrintedQuiz;
			for(let i = 0; i < currentPrintedQuiz.length; i++) {
				if(props.mode === "public" || (props.mode === "private" && currentQuizzes[i].owner === currentUser.uid)) {
					temp[i].author = currentUsers[temp[i].owner].name;
					//console.log(temp[i].author);
				}
			}
			setPrintedQuiz(temp);
		}, [currentPrintedQuiz, currentQuizzes, currentUser.uid, currentUsers, props.mode]
	);

	useEffect(() => {
		getAuthors();
	}, [currentPrintedQuiz, getAuthors]);

	useEffect(() => {
		if(init < 2)
			initialize();
	}, [currentQuizzes, currentUser, wait, initialize, init]);

	const listQuizzes = currentPrintedQuiz.map((quiz, idx) =>
		<div className="quiz-card" key={'Q' + idx}>
			<span className="quiz-card-name">{quiz.name}</span>
			<span className="quiz-card-description">{(props.mode === "private") ? quiz.description : quiz.author}</span>
			<span className="quiz-card-questions">{quiz.length}</span>
			<span className="quiz-card-score">{quiz.maxScore} pts</span>
			<span className="quiz-card-time">{quiz.duration} min</span>
			<div className="quiz-card-buttons">
				{(quiz.owner === currentUser.uid) ?
					<>
						<Link
							to={{
								pathname: "/edit/" + quiz.absoluteIndex,
								state: { quiz: quiz }
							}}
						>
							<Button text="Edit"/>
						</Link>
						<Link
							to={{
								pathname: "/work/" + quiz.absoluteIndex,
								state: { quiz: currentQuizzes }
							}}
						>
							<Button variant="btn-info" text="Work"/>
						</Link>
						<Button variant="btn-error" text="Delete" trigger={() => props.deleteQuiz(quiz.absoluteIndex)}/>
					</>
				:
					<>
						<Link
							to={{
								pathname: "/work/" + quiz.absoluteIndex,
								state: { quiz: currentQuizzes }
							}}
						>
							<Button variant="btn-info" text="Work"/>
						</Link>
					</>
				}
			</div>
		</div>
	);

	const headerQuizzes = (
		<div className="quiz-top">
			<span className="quiz-card-name">Name</span>
			<span className="quiz-card-description">{(props.mode === "private") ? "Descriptor" : "Author"}</span>
			<span className="quiz-card-questions">Questions</span>
			<span className="quiz-card-score">Max Score</span>
			<span className="quiz-card-time">Duration</span>
			<div className="quiz-card-buttons">
			</div>
		</div>	
	);

	function createQuiz() {
		props.createQuiz(
			document.getElementById('quiz-name').value,
			document.getElementById('quiz-description').value,
			document.getElementById('quiz-duration').value,
		);
		closeModal();
	}

	function showQuizCreationForm() {
		showModal( 
			<>
				<h3>Create Quiz</h3>
				<Form
					fields={
						'[ \
							{"name":"Quiz Name", "type":"text", "rule":"length5-32"}, \
							{"name":"Quiz Description", "type":"textarea", "rule":"length5-48"}, \
							{"name":"Quiz Duration", "type":"number", "rule":"value1-300"} \
						]'
					}
					id="create-quiz"
					addToast={addToast}
					submitAction={createQuiz}
					submitIcon="edit"
					submitText="Create"
					msgTop="Fill in your quiz details."
				/>
				{/* <div className="modal-input">
					<h4>Quiz Name</h4>
					<input className="input-box" id="quiz-name" type="text"/>
				</div>
				<div className="modal-input">
					<h4>Quiz Description</h4>
					<textarea className="input-box" id="quiz-description" type="text"/>
				</div>
				<div className="modal-input">
					<h4>Quiz Duration (minutes)</h4>
					<input className="input-box" id="quiz-duration" min="1" max="300" type="number"/>
				</div>
				<h4></h4>
				<div className="modal-group">
					<Button color="btn-info" startIcon="edit" text="Create" trigger={createQuiz}/>
					<Button variant="outline" text="Cancel" trigger={closeModal}/>
				</div> */}
			</>
		, 0.5);
	}

	// if(currentUserData !== null)
	//console.log(currentUserData.createQuiz);
	const addQuiz = (currentUserData === null || currentUser === 'null' || currentUserData.createQuiz >= QUIZ_PER_USER_LIMIT - 1) ?
	(
		<>
		</>
	)
	:
	(
		<div id="add-quiz" onClick={showQuizCreationForm}>
			<span id="add-quiz-chevron">&gt;&nbsp;</span>
			<span>Create New Quiz.</span>
		</div>
	)
	if(currentRender === false) {
		return (
			<Loading />
		);
	} else {
		return (
			<>
				<h1>{(props.mode === "private") ? "Your Quizzes" : "All Quizzes"}</h1>
				<div id="quizzes">
					{headerQuizzes}
					{listQuizzes}
					{addQuiz}
				</div>
			</>		
		);
	}
}