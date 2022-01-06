/*
React Stuff
*/
import React, { useState, useEffect, useCallback } from 'react';

/*
Imports from Other .js Files
*/
import { ToastContext } from '../App.js';

/*
CSS Imports
*/
import '../css/Questions.css';
import '../css/QuizEditor.css';
import '../css/QuizReview.css';

/*
	********************
	Some Javascript Objects for
	- Question:
	  > QuestionMC: MultipleChoice
      > QuestionSA: ShortAnswer
	- QuizPack

	Their attributes and methods are self-explanatory.
	********************
*/

export function getQuizPackFromJSON(object) {
	//console..log(object);
	if(object === undefined)
		return;
	return new QuizPack(object.name, object.description, object.length, object.duration, object.absoluteIndex, object.questionCount, object.maxScore, object.owner);
}

export function getQuestionFromJSON(object) {
	let question;
	switch(object.type) {
		case "Multiple Choice":
			question = new QuestionMC(object.question, object.choices, object.correct, object.score, object.absoluteIndex, object.qid);
			break;
		default:
			question = new QuestionSA(object.question, object.accept, object.score, object.absoluteIndex, object.qid);
			break;
	}

	return question;
}

export class Question {
	generateID(x) {
		return Math.floor(Math.random() * 1000000 + x);
	}
	constructor(question, score, absoluteIndex, qid=this.generateID(score)) {
		this.question = question;
		this.score = score;
		this.qid = parseInt(qid);
		this.kid = this.qid;
		this.absoluteIndex = absoluteIndex;
	}
	refresh() {
		this.kid = this.generateID(this.score);
		
		//////console..log("Generating New KID: " + this.kid);
	}
	setQuestion(question) {
		this.refresh();
		this.question = question;
	}
	setScore(score) {
		this.score = score;
		this.refresh();
	}
	getType() {
		return this.type;
	}
}

export class QuestionMC extends Question {
	constructor(question, choices, correct, score, absoluteIndex, qid) {
		super(question, score, absoluteIndex, qid);
		this.correct = correct;
		this.choices = choices;
		this.type = "Multiple Choice";
	}
	
	setCorrect(correct) {
		this.refresh();
		this.correct = correct;
	}
	setChoice(idx, choice) {
		this.refresh();
		this.choices[idx] = choice;
	}
	setChoices(choices) {
		this.refresh();
		this.choices = choices;
	}
}

export class QuestionSA extends Question {
	constructor(question, accept, score, absoluteIndex, qid) {
		super(question, score, absoluteIndex, qid);
		this.accept = accept;
		this.type = "Short Answer";
	}
	
	setAccept(accept) {
		this.refresh();
		this.accept = accept;
	}
}

export function toQuiz(name, description, length, duration, absoluteIndex, questionCount, maxScore, owner, kid=null) {
	return new QuizPack(name, description, length, duration, absoluteIndex, questionCount, maxScore, owner, kid);
}

export class QuizPack {
	generateID(x) {
		return Math.floor(Math.random() * 1000000 + x);
	}
	constructor(name, description, length, duration, absoluteIndex, questionCount, maxScore, owner, kid=this.generateID(0)) {
		this.name = name;
		this.description = description;
		this.length = length;
		this.code = name;
		this.duration = duration;
		this.kid = kid;
		this.absoluteIndex = absoluteIndex;
		this.questionCount = questionCount;
		this.maxScore = maxScore;
		this.owner = owner;
	}
	refresh() {
		this.kid = this.generateID(this.name.length);
	}
	setName(name) {
		this.name = name;
		this.refresh();
	}
	setDescription(description){
		this.description = description;
		this.refresh();
	}
	setQuestions(questions) {
		this.questions = questions;
		this.refresh();
	}
	setDuration(duration) {
		this.duration = duration;
		this.refresh();
	}
	setScore(score) {
		this.score = score;
		this.refresh();
	}
	update(name, description, questions, duration, score=null) {
		if(name !== null || name !== this.name)
			this.name = name;
		if(description !== null || description !== this.description)
			this.description = description;
		if(questions !== null || questions !== this.questions)
			this.questions = questions;
		if(duration !== null || duration !== this.duration)
			this.duration = duration;
		if(score !== null || score !== this.score)
			this.score = score;
		this.refresh();
	}
}

export class Quizzes {
	generateID(x) {
		return Math.floor(Math.random() * 1000000 + x);
	}
	constructor(quizzes) {
		this.quizzes = quizzes;
		this.kid = this.generateID(quizzes.length);
	}
	refresh() {
		this.kid = this.generateID(this.quizzes.length);
	}
	setQuizzes(quizzes) {
		this.quizzes = quizzes;
	}
}

function cleanUp(idx) {
	const choices = document.getElementById("q" + idx + "-choices");
	while (choices && choices.firstChild) {
		choices.removeChild(choices.lastChild);
	}
}

export default function QuestionEditCard(props) {

	/*
		********************
		Some states, and context variables.
		********************
	*/
	const [currentQuestion, setQuestion] = useState(props.question);
	const [currentEdit, toggleEdit] = useState(0);
	const context = React.useContext(ToastContext);  

	let addToast = context.addToast;

	const updateQuestion = useCallback(
		function() {
			props.updateQuestion(currentQuestion, props.idx - 1);
		},
		[currentQuestion, props]
	);

	/*
		********************
		The following functions handle the updating of a question (whether it be the score, answer choice, etc).
		(They update the current question in this component and the corresponding question in the parent).
		********************
	*/

	// Given scoreInputBox, update the current question's score.
	function setScore(scoreInputBox) {
		let score = parseInt(scoreInputBox.target.value);

		if(document.getElementById("q" + props.idx + "-score") !== undefined) {
			if(score > 100) {
				score = 100;
			} else if(score < 0) {
				score = 0;
			} else if(!(score >= 0 && score <= 100)){
				score = 0;
			}
			document.getElementById("q" + props.idx + "-score").value = score;
		}
	}

	// Update score if it has changed.
	function updateScore() {
		let newScore = parseInt(document.getElementById("q" + props.idx + "-score").value);
		let change = newScore - currentQuestion.score;

		// If the score stays the same, then don't update.
		let temp = currentQuestion;
		temp.setScore(newScore);
		setQuestion(temp);
		if(change !== 0)
			props.updateScore(change);
		
		updateQuestion();
	}
	
	// Given a choice j, update the current question's j-th choice depending on the j-th input choice box.
	const updateChoice = useCallback(
		function(j) {
			let temp = currentQuestion;

			if(temp.type === "Multiple Choice") {
				temp.setChoice(j, document.getElementById("q" + props.idx + "-choices-" + j).value);
				setQuestion(temp);
				updateQuestion();
			}
		},
		[currentQuestion, props.idx, updateQuestion]
	);

	const setCorrect = useCallback(
		function(j="") {
			let temp = currentQuestion;
		
			switch(temp.type) {
				case "Multiple Choice":
					temp.setCorrect(j);
					break;
				default:
					temp.setAccept(document.getElementById("q" + props.idx + "-accept").value);
					break;
			}

			setQuestion(temp);
			updateQuestion();
			},
		[currentQuestion, props.idx, updateQuestion]
	);

	// Change the current question's question type.
	// It is modular, so new question types can be added easily.
	function setType() {
		let temp = currentQuestion;
		let tempQ;

		switch(temp.type) {
			case "Multiple Choice":
				tempQ = new QuestionSA(temp.question, 'Answer', temp.score, temp.absoluteIndex);
				break;
			default:
				tempQ = new QuestionMC(temp.question, ['Choice I', 'Choice II', 'Choice III', 'Choice IV', 'Choice V'], 1, temp.score, temp.absoluteIndex);
				break;
		}

		setQuestion(tempQ);
		updateQuestion();
	}

	// Delete the current question, will call a function from the parent component.
	// Ensures that a question must not be currently edited for it to be deleted.
	function deleteQuestion() {
		if(props.idx - 1 !== props.currentEdit) {
			props.deleteQuestion(currentQuestion.qid, props.idx - 1);
		} else {
			addToast('error', 'Hey!', 'Stop editing the question before deleting it.', 1);
		}
	}

	// This function will be called when re-rendering, to clean up existing answer elements.
	// const cleanUp = useCallback(
	// 	function() {
	// 		const choices = document.getElementById("q" + props.idx + "-choices");
	// 		while (choices && choices.firstChild) {
	// 			choices.removeChild(choices.lastChild);
	// 		}
	// 	},
	// 	[props.idx]
 	// );

	// This function handles the edit status of the current question.
	function updateEditIcon() {
		if(currentEdit === 0) {
			toggleEdit(props.updateEdit(props.idx));
		} else {
			toggleEdit(props.closeEdit());
		}
	}

	useEffect(() => {
		// Ensures that currentQuestion is an object of Question
		if(currentQuestion && !(currentQuestion instanceof Question)) {
			if(currentQuestion.type === 'Multiple Choice') {
				setQuestion(new QuestionMC(
					currentQuestion.question,
					currentQuestion.choices,
					currentQuestion.correct,
					currentQuestion.score,
					currentQuestion.qid
				));
			} else if(currentQuestion.type === 'Short Answer') {
				setQuestion(new QuestionSA(
					currentQuestion.question,
					currentQuestion.accept,
					currentQuestion.score,
					currentQuestion.qid
				));
			}
		}

		// When some state is updated, update the question to the parent components.
		// updateQuestion();

		// If there are some other editor being opened, and this current question is being opened,
		// Toggle the edit status of this question.
		if((currentEdit === 1 && props.currentEdit >= 0 && props.idx - 1 !== props.currentEdit)) {
			toggleEdit(0);
		}

		// Question text's HTML
		document.getElementById("q" + props.idx + "-questText").innerHTML = currentQuestion.question;

		// Set Up Short Answer
		if(currentQuestion.type === 'Short Answer') {
			cleanUp(props.idx);
			let answerBox = document.createElement("input");
			answerBox.className = "input-accept";
			answerBox.placeholder = "Answer";
			answerBox.maxLength = 32;
			answerBox.id = "q" + props.idx + "-accept";
			answerBox.value = currentQuestion.accept;
			document.getElementById("q" + props.idx + "-choices").appendChild(answerBox);
			answerBox.addEventListener('change', function() {
				setCorrect(props.idx);
			});
		}

		// Set up Multiple Choice Answers
		for(let j = 0; currentQuestion.type === 'Multiple Choice' && j < currentQuestion.choices.length; j++) {
			if(j === 0)
				cleanUp(props.idx);

			// Create the HTML elements for this particular answer choice.
			let choiceBox = document.createElement("input");
			let wrapper = document.createElement("div");
			let checkBox = document.createElement("input");

			wrapper.id = "q" + props.idx + "-choices-" + j + "-wrapper";
			wrapper.className ="choices-wrapper";

			choiceBox.id = "q" + props.idx + "-choices-" + j;
			choiceBox.className = "input-choices";
			choiceBox.placeholder = "Answer Choice";

			checkBox.className = "btn-choices";
			checkBox.type = "radio";
			checkBox.name = "q" + props.idx + "-choices";

			// Make the radio button checked if it is the correct choice (for editor only).
			if(j === currentQuestion.correct) {
				checkBox.checked = true;
			}

			// Store answer choices (Multiple Choice)
			choiceBox.addEventListener('change', function() {
				updateChoice(j);
			});

			// Logic to store correct answer data (Multiple Choice)
			checkBox.addEventListener('click', function() { setCorrect(j) });

			// Add these elements to an existing HTML element.
			document.getElementById("q" + props.idx + "-choices").appendChild(wrapper);
			document.getElementById("q" + props.idx + "-choices-" + j + "-wrapper").appendChild(checkBox);
			document.getElementById("q" + props.idx + "-choices-" + j + "-wrapper").appendChild(choiceBox);
			document.querySelector("#" + choiceBox.id).value = currentQuestion.choices[j];
		}

		// Indicate Selected Mode
		let dropdown = document.getElementById("q" + props.idx +"-type");

		for(let j = 0; j < dropdown.options.length; j++) {
			if(dropdown.options[j].value === currentQuestion.type) {
				dropdown.options[j].selected = true;
				break;
			}
		}

		let scoreBox = document.getElementById("q" + props.idx +"-score");
		scoreBox.value = currentQuestion.score;
	}, [currentQuestion, currentEdit, props.currentEdit, props.idx, setCorrect, updateChoice]);

	return (
		<div className="question-card" id={"q" + props.idx +"-container"}>
			
			<div className="question-back">
				{props.idx}
			</div>

			<button type="button" className="question-action question-edit" id={"q" + props.idx +"-edit"} onClick={updateEditIcon}>
				<span className="material-icons">
					{(props.idx - 1 === props.currentEdit) ? "close" : "edit" }
				</span>
			</button>

			<button type="button" className="question-action question-delete" id={"q" + props.idx +"-delete"} onClick={deleteQuestion}>
				<span className="material-icons">
					delete
				</span>
			</button>
			<div className="question-text" id={"q" + props.idx}>
				<div className="question-text" id={"q" + props.idx +"-questText"}>

				</div>
			</div>
			<div className="question-choices" id={"q" + props.idx +"-choices"}>
				
			</div>
			<table className="question-controls">
				<tbody>
					<tr>
						<th className="question-controls-label">Score</th>
						<th className="question-controls-label">Type</th>
					</tr>
					<tr>
						<td>
							<input className="input-box" id={"q" + props.idx +"-score"} type="number"
								min="0" max="100" onInput={setScore} onBlur={updateScore}/>
						</td>
						<td>
							<select className="input-box" id={"q" + props.idx +"-type"} onInput={setType}>
								<option>Multiple Choice</option>
								<option>Short Answer</option>
							</select>
						</td>
					</tr>
				</tbody>
			</table>	
		</div>
	);
}

export function QuestionEditList(props) {
	if(props.currentQuestions !== undefined) {
		return props.currentQuestions.map((val, idx) =>
			<QuestionEditCard question={val} idx={idx + 1} key={val.kid} updateQuestion={props.updateQuestion} updateScore={props.updateScore}
				deleteQuestion={props.deleteQuestion} updateEdit={props.updateEdit} closeEdit={props.closeEdit} currentEdit={props.currentEdit}/>
		);
	} else {
		return (
			<div>
			</div>
		);
	}
}

export function QuestionReviewCard(props) {

	/*
		********************
		Some states, and context variables.
		********************
	*/
	const [currentQuestion, setQuestion] = useState(props.question);

	// This function will be called when re-rendering, to clean up existing answer elements.


	useEffect(() => {
		// Ensures that currentQuestion is an object of Question
		if(currentQuestion && !(currentQuestion instanceof Question)) {
			//////console..log(currentQuestion);
			if(currentQuestion.type === 'Multiple Choice') {
				setQuestion(new QuestionMC(
					currentQuestion.question,
					currentQuestion.choices,
					currentQuestion.correct,
					currentQuestion.score,
					currentQuestion.qid
				));
			} else if(currentQuestion.type === 'Short Answer') {
				setQuestion(new QuestionSA(
					currentQuestion.question,
					currentQuestion.accept,
					currentQuestion.score,
					currentQuestion.qid
				));
			}
		}

		// Question text's HTML
		document.getElementById("q" + props.idx + "-questText").innerHTML = currentQuestion.question;

		// Set Up Short Answer
		if(currentQuestion.type === 'Short Answer') {
			cleanUp(props.idx);
			let answerBox = document.createElement("input");
			answerBox.className = "input-accept";
			answerBox.placeholder = "Answer";
			answerBox.maxLength = 32;
			answerBox.id = "q" + props.idx + "-accept";
			answerBox.value = currentQuestion.accept;
			document.getElementById("q" + props.idx + "-choices").appendChild(answerBox);
			answerBox.disabled = true;
		}

		// Set up Multiple Choice Answers
		for(let j = 0; currentQuestion.type === 'Multiple Choice' && j < currentQuestion.choices.length; j++) {
			if(j === 0)
				cleanUp(props.idx);

			// Create the HTML elements for this particular answer choice.
			let choiceBox = document.createElement("input");
			let wrapper = document.createElement("div");
			let checkBox = document.createElement("input");

			wrapper.id = "q" + props.idx + "-choices-" + j + "-wrapper";
			wrapper.className ="choices-wrapper";

			choiceBox.id = "q" + props.idx + "-choices-" + j;
			choiceBox.className = "input-choices";
			choiceBox.placeholder = "Answer Choice";
			choiceBox.disabled = true;

			checkBox.className = "btn-choices";
			checkBox.type = "radio";
			checkBox.name = "q" + props.idx + "-choices";
		
			let status = document.createElement("div");
			let icon = document.createElement("span");
			status.className = "choice-status";
			status.id = `q${props.idx}-status`;
			icon.className = "material-icons-outlined";
			
			// Make the radio button checked if it is the correct choice (for editor only).
			if(j === currentQuestion.correct) {
				// document.getElementById("q" + props.idx + "-container").className += " correct-choice";
				choiceBox.className += " correct-choice";
				icon.innerHTML = "check";
			} else if(j === props.answer) {
				// document.getElementById("q" + props.idx + "-container").className += " wrong-choice";
				choiceBox.className += " wrong-choice";
				icon.innerHTML = "clear";
			}

			if(j !== props.answer) {
				checkBox.disabled = true;
			} else {
				checkBox.checked = true;
			}

			// Add these elements to an existing HTML element.
			document.getElementById("q" + props.idx + "-choices").appendChild(wrapper);
			document.getElementById("q" + props.idx + "-choices-" + j + "-wrapper").appendChild(checkBox);
			document.getElementById("q" + props.idx + "-choices-" + j + "-wrapper").appendChild(choiceBox);
			document.querySelector("#" + choiceBox.id).value = currentQuestion.choices[j];

			if(j === props.answer) {
				document.getElementById("q" + props.idx + "-choices-" + j + "-wrapper").appendChild(status);
				document.getElementById(`q${props.idx}-status`).appendChild(icon);
			}
		}
	}, [currentQuestion, props.idx, props.answer] );

	return (
		<div className="question-card" id={"q" + props.idx +"-container"}>
			
			<div className="question-back">
				{props.idx}
			</div>

			<div className="question-text" id={"q" + props.idx}>
				<div className="question-text" id={"q" + props.idx +"-questText"}>

				</div>
			</div>
			<div className="question-choices" id={"q" + props.idx +"-choices"}>
				
			</div>
		</div>
	);
}

export function QuestionReviewList(props) {
	// //////console..log(props.currentQuestions)
	if(props.currentQuestions !== undefined) {
		return props.currentQuestions.map((val, idx) =>
			<QuestionReviewCard question={val} answer={props.currentAnswers[idx]} idx={idx + 1} key={val.kid}/>
		);
	} else {
		return (
			<div>
			</div>
		);
	}
}

export function QuestionWorkCard(props) {

	/*
		********************
		Some states, and context variables.
		********************
	*/
	const currentQuestion = props.question;
	const [init, setInit] = useState(false);

	const saveAnswer = useCallback(
		function(x="") {
			let temp = currentQuestion;
			if(temp.type === 'Multiple Choice')  {
				props.setAnswers(props.idx, x);
			} else if(temp.type === 'Short Answer') {
				props.setAnswers(props.idx, document.getElementById("q"+props.idx+"-accept").value);
			}
		}, [currentQuestion, props]
	);

	const initialize = useCallback(
		function() {
			// Question text's HTML
			document.getElementById("q" + props.idx + "-questText").innerHTML = currentQuestion.question;

			// Set Up Short Answer
			if(currentQuestion.type === 'Short Answer') {
				cleanUp(props.idx);
				let node = document.createElement("input");
				node.className = "input-accept";
				node.placeholder = "Answer";
				node.id = "q" + props.idx + "-accept";
				document.getElementById("q" + props.idx + "-choices").appendChild(node);
				node.addEventListener('change', function() {
					saveAnswer();
				});
			}

			// Set up Multiple Choice Answers
			for(let j = 0; currentQuestion.type === 'Multiple Choice' && j < currentQuestion.choices.length; j++) {
				if(j === 0)
					cleanUp(props.idx);

				// Create the HTML elements for this particular answer choice.
				let node = document.createElement("input");
				let wrapper = document.createElement("div");
				let btn = document.createElement("input");
				wrapper.id = "q" + props.idx + "-choices-" + j + "-wrapper";
				node.id = "q" + props.idx + "-choices-" + j;
				wrapper.className ="choices-wrapper";
				node.className = "input-choices";
				node.placeholder = "Answer Choice";
				node.disabled = true;
				btn.className = "btn-choices";
				btn.type = "radio";
				btn.name = "q" + props.idx + "-choices";

				// Make the radio button checked if it is the correct answer.
				if(j === currentQuestion.correct) {
					// btn.checked = true;
				}

				// Store answer choices (Multiple Choice)
				node.addEventListener('change', function() {
					saveAnswer(j);
				});

				// Logic to store correct answer data (Multiple Choice)
				btn.addEventListener('click', function() { saveAnswer(j) });

				// Add these elements to an existing HTML element.
				document.getElementById("q" + props.idx + "-choices").appendChild(wrapper);
				document.getElementById("q" + props.idx + "-choices-" + j + "-wrapper").appendChild(btn);
				document.getElementById("q" + props.idx + "-choices-" + j + "-wrapper").appendChild(node);
				document.querySelector("#" + node.id).value = currentQuestion.choices[j];
			}

			setInit(true);
		}, [currentQuestion.choices, currentQuestion.correct, currentQuestion.question, currentQuestion.type, props.idx, saveAnswer]
	);

	useEffect(() => {
		if(!init) initialize();
	}, [ currentQuestion, init, initialize ]);
	
	return (
		<div className="question-card" id={"q" + props.idx +"-container"}>
			
			<div className="question-back">
				{props.idx}
			</div>

			<div className="question-text" id={"q" + props.idx}>
				<div className="question-text" id={"q" + props.idx +"-questText"}>
					
				</div>
			</div>
			<div className="question-choices" id={"q" + props.idx +"-choices"}>
				
			</div>
		</div>
	);
}

export function QuestionWorkList(props) {
	if(props.currentQuestions !== null) {
		return props.currentQuestions.map((val, idx) =>
			<QuestionWorkCard question={val} idx={idx + 1} key={val.kid} setAnswers={props.setAnswers}/>
		);
	} else {
		return (
			<div>
			</div>
		);
	}
}