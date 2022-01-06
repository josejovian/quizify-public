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
import * as Quill from 'quill';
import { QuizHeader } from '../Components/QuizHeader.js';
import { ToastContext, UserContext } from '../App.js';
import { QuestionMC,toQuiz } from '../Components/Question.js';
import { QuestionEditList } from '../Components/Question.js';
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
	quill: variable to contain the quill editor object.
	********************
*/
let quill = null;
const QUIZ_QUESTION_LIMIT = 30;

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
	let [currentEdit, setEdit] = useState(-1);
	let [currentRender, setRender] = useState(false);
	let [currentChange, setChange] = useState([]);
	
	/*
		To ensure init function is run only once, not every rerender.
	*/
	let [init, setInit] = useState(false);
	let [wait, setWait] = useState(true);

	/*
		Handle contexts from App.js.
	*/
	const contextToast = React.useContext(ToastContext);
	let addToast = contextToast.addToast;

	const contextUser = React.useContext(UserContext);
	const { currentUser } = contextUser;

	/*
		********************
		Initialize function, in case if the user directly uses link to edit a Quiz.
		********************
	*/
	const initialize = useCallback(
		async function() {
			//console.log(currentUser);
	
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
	
			// Get link, then get the quiz code (based on the link).
			let quizCode = loc.pathname.replace("/edit/", "");	
	
			// Fetch data immediately from database
			await props.getQuizAndQuestions(quizCode).then(bundle => {
				if(bundle[0] === null) {
					showModalNotice('NOT_FOUND');
					return;
				}
	
				setQuiz(bundle[0]);
				setQuestions(bundle[1]);
				setScore(calculateScore(bundle[1]));
				
				if(bundle[0].owner !== currentUser.uid) {
					showModalNotice('OWNER_MISMATCH');
					return;
				} else {
					setRender(true);
				}
			});
		}, [currentRender, currentUser, init, loc.pathname, props, wait]
	);
	

	/*
		********************
		Close edit function.
		********************
	*/
	function closeEdit(idx=null) {
		if(document.getElementById("edit") !== null && document.getElementsByClassName("ql-toolbar")[0] ) {	
			
			// Update some CSS.		
			let tempID = document.getElementById("edit").parentElement.id.match(/q((\d)*)*-container/)[1];
			let questText = "q" + (tempID) + "-questText";
			document.getElementById(questText).className = "question-text";

			// Update the current Question.
			let tempQuestions = currentQuestions;
			
			tempQuestions[tempID - 1].question = document.getElementsByClassName("ql-editor")[0].innerHTML;
			setQuestions(tempQuestions);
			document.getElementById(questText).innerHTML = document.getElementsByClassName("ql-editor")[0].innerHTML;
			
			// Cleanup Quill Editors.
			if(document.getElementsByClassName("ql-editor")[0].innerHTML !== currentQuestions[tempID - 1]) {
				//console.log(document.getElementsByClassName("ql-editor")[0].innerHTML);
				setChange([...currentChange, {'action': 'update', 'idx': tempID - 1, 'absoluteIndex': tempQuestions[tempID - 1].absoluteIndex}]);
			}
			document.getElementsByClassName("ql-toolbar")[0].remove();
			document.getElementsByClassName("ql-container")[0].remove();
			setEdit(-1);
			
		}
		return 0;
	}

	/*
		********************
		Update quiz function.
		********************
	*/
	function updateQuiz(quiz) {
		//console.log("Update Quiz: " + currentQuestions.length);
		props.updateQuiz(
			currentQuiz.absoluteIndex,
			quiz,
			currentQuestions
		);
	}

	/*
		********************
		Update edit function.
		********************
	*/
	const updateEdit = (idx) => {

		let currentQuestion = (idx > -1) ? (currentQuestions[idx - 1].question) : null;
		let editDiv = document.createElement("div");
		editDiv.id = "edit";
		
		/*
			********************
			If there is some other editor available, force close it (while updating the previous editor).
			********************
		*/
		if(currentEdit > -1) {
			document.getElementById("q" + (currentEdit + 1) + "-questText").className = "question-text";
			if(document.getElementById("edit") && currentQuestions[idx - 1]) {
				let tempQuestions = currentQuestions;
				tempQuestions[idx - 1].question = quill.root.innerHTML;
				setQuestions(tempQuestions);
				setChange([...currentChange, {'action': 'update', 'idx': idx - 1, 'absoluteIndex': tempQuestions[idx - 1].absoluteIndex}]);
				closeEdit();
			}
		}

		if(idx >= 0 && document.getElementById("q" + idx + "-container") !== undefined) {
			if(currentEdit > -1 && currentQuestions[currentEdit])
				document.getElementById("q" + idx + "-questText").innerHTML = currentQuestions[currentEdit].question;

			document.getElementById("q" + idx + "-questText").className += " hidden";
			document.getElementById("q" + idx + "-container").prepend(editDiv);
		}

		if(document.getElementsByClassName("ql-toolbar")[0] !== undefined && document.getElementsByClassName("ql-container")[0] !== undefined) {
			document.getElementsByClassName("ql-toolbar")[0].remove();
			document.getElementsByClassName("ql-container")[0].remove();
		}

		setEdit(idx - 1);

		/*
			********************
			Show New Quill Editor
			********************
		*/
		if(idx >= 0 && document.getElementById("edit") !== undefined) {
			
			quill = new Quill("#edit", {
				modules: {
				toolbar: [
					['bold', 'italic', 'underline', 'strike'],
					[{ 'list': 'ordered'}, { 'list': 'bullet' }],
					[{ 'script': 'sub'}, { 'script': 'super' }],
					['link']
				]
				},
				placeholder: 'Write a question here...',
				theme: 'snow'
			});
			
			if(idx - 1 > -1)
				quill.root.innerHTML = currentQuestion;

			quill.on('editor-change', function(delta, source) {
				if(source === 'user') {
					delta = quill.getContents();
					localStorage.setItem('delta', delta);	
				}
			});	

			//https://github.com/quilljs/quill/issues/1184
			quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
				let ops = []
				delta.ops.forEach(op => {
					if(op.insert && typeof op.insert === 'string') {
						ops.push({
							insert: op.insert
						})
					}
				})
				delta.ops = ops
				return delta
			});
		}

		return 1;
	}

	/*
		********************
		Delete a question, given the appropriate qid.
		The IDX is used to handle shifting in the indexes.
		********************
	*/
	function deleteQuestion(qid, idx) {
		let tempQuestions = currentQuestions;

		// If there is only one question, show an error toast.
		if(currentQuestions.length === 1) {
			addToast('error', 'Hey!', 'A quiz should contain at least one question.', 1);
			return;
		}

		let conf = true //window.confirm("Are you sure you want to delete this question?");

		// When user says no, conf becomes false, so the function immediately stops.
		if(!conf) {
			return;
		}

		setChange([...currentChange, {'action': 'delete', 'idx': idx, 'absoluteIndex': tempQuestions[idx].absoluteIndex}]);

		// When edit is active, and user is deleting a question that is BEFORE the edited question,
		// there would be a shift in the indexes. This is to handle that.
		if(currentEdit > idx)
			setEdit(currentEdit - 1);

		updateScore(-1*tempQuestions[idx].score);

		setQuestions(currentQuestions.filter((value, index) => {
			return (value.qid !== qid);
		}));

		let tempQuiz = currentQuiz;

		tempQuiz.questionCount--;

		setQuiz(tempQuiz);

	}

	useEffect(() => {
		initialize();
	}, [ initialize, currentUser, wait ]);

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
	// useEffect(() => {
		// if(!init) initialize();

		// ////console.log(currentQuestions);

		// let tempQuiz = currentQuiz;
		// if(tempQuiz instanceof QuizPack) {
		// 	tempQuiz.setQuestions(currentQuestions);
		// }
		// setQuiz(tempQuiz);
		
	// }, [ currentQuestions, currentUser ]);

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
	
			let add = document.createElement('div');
			add.className = "placeholder-card question-card";
			add.id ="add-question";
	
			let addText = document.createElement('span');
			addText.innerHTML = "Add Question";
			
			add.addEventListener('click', function() {
				let newQuestion = new QuestionMC('<p>Click the pencil icon on this card to edit this question! </p>', ['Choice I', 'Choice II', 'Choice III', 'Choice IV', 'Choice V'], 1, 10, currentQuiz.questionCount);
				setQuestions([...currentQuestions, newQuestion]);
				updateScore(10);
				setChange([...currentChange, {'action': 'create', 'idx': currentQuestions.length, 'absoluteIndex': currentQuiz.questionCount}]);
				let tempQuiz = currentQuiz;
				tempQuiz.questionCount++;
				setQuiz(tempQuiz);
			});

			add.appendChild(addText);
	
			while(document.getElementsByClassName('placeholder-card question-card')[0]) {
				let pad = document.getElementsByClassName('placeholder-card question-card')[0];
				pad.remove();
			}
	
			if(document.getElementById('questions') === null || !currentQuestions) {
				return;
			}

			// Validation: One quiz can only contain 60 questions at most
			if(currentQuestions.length >= QUIZ_QUESTION_LIMIT) {
				add = padder;
			}

			if((3 - currentQuestions.length % 3) === 2) {
				document.getElementById('questions').appendChild(add);
				document.getElementById('questions').appendChild(padder);
			} else if((3 - currentQuestions.length % 3) === 1) {
				document.getElementById('questions').appendChild(add);
			} else {
				document.getElementById('questions').appendChild(add);
				document.getElementById('questions').appendChild(padder);
				document.getElementById('questions').appendChild(padder);
			}
		}
	});

	/*
		********************
		Updates a question in the state, given the appropriate question object and idx index.
		********************
	*/
	function updateQuestion(question, idx) {
		
		let tempQuestions = currentQuestions;
		////console.log(`Comparing ${tempQuestions[idx].kid} ${question.kid}`)
		if(question === undefined)
			return;

		// if(true || currentQuestions[idx].kid !== question.kid) {
		////console.log("Added to Changelog");
		tempQuestions[idx] = question;
		setChange([...currentChange, {'action': 'update', 'idx': idx, 'absoluteIndex': tempQuestions[idx].absoluteIndex}]);

	}

	// SetScore based on changes.
	function updateScore(change) {
		setScore(currentScore + change);
	}

	// Delete quiz from parent component.
	function deleteQuiz() {
		props.deleteQuiz(currentQuiz.code);
	}

	// Save quiz to parent component.
	function saveQuiz() {
		if(currentChange.length === 0)
			return;
		
		props.updateQuestions(currentQuiz.absoluteIndex, currentChange, currentQuestions).catch((e) => {
			
		});
		updateQuiz(currentQuiz);
		setChange([]);
	}

	if(currentRender === false) {
		return (
			<Loading />
		);
	} else {
		return (
			<div className="editor">
				<header id="header">
					<h1>Edit Quiz</h1>
					<QuizHeader 
						mode="edit"
						quiz={currentQuiz}
						currentQuestions={currentQuestions}
						currentScore={currentScore}
						currentChange={currentChange}
						quizSettings={
							<QuizSettings
								quiz={currentQuiz}
								updateQuiz={updateQuiz}
								deleteQuiz={deleteQuiz}
								setQuiz={setQuiz}
								addToast={addToast}
							/>
						}
						saveQuiz={() => saveQuiz}/>
				</header>
				<div id="questions">
					<QuestionEditList currentQuestions={currentQuestions} updateQuestion={updateQuestion} updateScore={updateScore}
						deleteQuestion={deleteQuestion} updateEdit={updateEdit} closeEdit={closeEdit} currentEdit={currentEdit}/>
				</div>		
			</div>
		);
	}
	
}
