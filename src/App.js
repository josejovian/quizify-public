/*
React Stuff
*/
import React, { useState, useEffect } from 'react';
import { Switch, Route } from "react-router-dom";
import { useHistory } from 'react-router'

/*
Imports from Other .js Files
*/
import QuizEditor from './Pages/QuizEditor.js';
import QuizWorker from './Pages/QuizWorker.js';
import QuizReview from './Pages/QuizReview.js';
import Collection from './Pages/Collection.js';
import Landing from './Pages/Landing.js'
import Works from './Pages/Works.js';
import WorkByQuiz from './Pages/WorkByQuiz.js';

import { getQuestionFromJSON, getQuizPackFromJSON, QuestionMC } from './Components/Question.js';
import Navigation from './Components/Navigation.js';
import Toasts, { Toast } from './Components/Toast.js';
import { showModal, closeModal } from './Components/Modal.js';
import { Form } from './Components/Input.js';

/*
Firebase Stuff
*/
import "firebase/database";
import "firebase/compat/database";
import firebase from 'firebase/compat/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set, child, get } from "firebase/database";

/*
CSS Imports
*/
import './css/App.css';
import './css/Quizzes.css';

/*
	********************
	Firebase Stuff.
	********************
*/

const config = {
	apiKey: process.env.REACT_APP_API_KEY,
	authDomain: process.env.REACT_APP_AUTH_DOMAIN,
	databaseURL: process.env.REACT_APP_DATABASE_URL,
	projectId: process.env.PROJECT_ID
};
const app = firebase.initializeApp(config);
const auth = getAuth();
const db = getDatabase(app);

/*
	********************
	Authentication Stuff.
	********************
*/

async function register() {
	try {
		let emailForm = document.getElementById("email");
		let nameForm = document.getElementById("name");
		let passwordForm = document.getElementById("password");
		let result = null;
		if(emailForm && nameForm && passwordForm) {
			await createUserWithEmailAndPassword(auth, emailForm.value, passwordForm.value).then(cred => {
				set(ref(db, `user/${cred.user.uid}`), {
					email: emailForm.value,
					name: nameForm.value,
					createQuiz: 0,
					workQuiz: 0
				});
			}).catch(error => {
				result = error;
			}).then(() => {
				if(result === null) {
					closeModal();
				}
			});
		}
		return result;
	} catch(e) {
		//console.log(e);
	};
}

async function login(history) {
	try {
		let emailForm = document.getElementById("email");
		let passwordForm = document.getElementById("password");
		let result = null;
		if(emailForm && passwordForm) {
			await signInWithEmailAndPassword(auth, emailForm.value, passwordForm.value).then(cred => {
			}).catch(error => {
				result = error;
			}).then(() => {
				if(result === null) {
					closeModal();
				}
			});
		}
		
		return result;
	} catch(e) {
		//console.log(e);
	};
}

/*
	********************
	Read/Write data From/To Database Functions
	********************
*/
async function fetchData(link) {
	let promise = new Promise(function(res, rej) {
		get(child(ref(db), link)).then((snapshot) => {
			let works = null;
			if(snapshot.exists()) {
				works = (snapshot.val());
			}
			//console.log(`Fetching ${link}`);
			//console.log(works);
			res(works);
		}).catch((error) => {
			rej(error);
		})
	});

	let result = await promise;
	return result;
}

async function fetchQuestions(quizCode) {
	let promise = new Promise(function(res, rej) {
		let questions = [];
		fetchData(`questions/${quizCode}/question/`).then((result) => {
			if(result === undefined || result === null) {
				showModalNotice('NOT_FOUND');
				rej('undefined');
			}
			let question = result;
			question = Object.values(question);
			question.forEach((data) => {
				data = getQuestionFromJSON(data);
				if(data)
					questions = [...questions, data];
			});
			res(questions);
		}).catch((error) => {
			rej(error);
		})
	});
	return promise;
}

async function getQuizAndQuestions(quizCode) {
	return [await fetchData(`quiz/${quizCode}/`), await fetchQuestions(quizCode)];
}

export async function initializePage() {
	let promise = new Promise((res, rej) => {
		setTimeout(() => {
			res(true);
		}, 1000);
	}).catch(e => {
		//console.log(e);
	});

	await promise;
}

export function showModalNotice(code) {
	let title, content;

	switch(code) {
		case 'GUEST_ACCESS':
			title = "Hey There...";
			content = "You must be logged in to access this feature."
			break;
		case 'OWNER_MISMATCH':
			title = "Hey There...";
			content = "You do not own this content, so you cannot access it.";
			break;
		default:
			title = "What?";
			content = "That content could not be found.";
			break;
	}

	showModal(
		<>
			<h3 id="notice-header">{title}</h3>
			<p id="notice-text">{content}</p>
		</>
	,1);
}

/*
	********************
	Context Stuff:
	- ToastContext: so that Contexts can be triggered from anywhere within the app.
	- QuizzesContext: so that the quiz data can be passed easily, though it's overkill (couldnt find any other way).
	- UserContext: so that all components have access to the user data.
	********************
*/

export const ToastContext = React.createContext({});
export const QuizzesContext = React.createContext({});
export const UserContext = React.createContext({});

const QUIZ_PER_USER_LIMIT = 5;

export default function App() {
	
	/*
		********************
		Global state for Toast/Quizzes.
		They can be modified/read from child components.
		********************
	*/
	const [currentToasts, setToasts] = useState([]);
	const [currentQuizzes, setQuizzes] = useState([]);
	const [currentUser, setUser] = useState('null');
	const [currentUserData, setUserData] = useState(null);
	const [currentDatabase, setDatabase] = useState();

	const [currentFetchQuizzes, setFetchQuizzes] = useState([]);
	const [init, setInit] = useState(false);
	const history = useHistory();
	const [ currentUsers, setUsers ] = useState([]);

	/*
		********************
		This function will be used for ToastContext, 
		so toasts can be triggered from anywhere within the app.
		********************
	*/
	function addToast(type, title, description, life) {
		let toast = new Toast(type, title, description, life);
		setToasts([...currentToasts, toast]);
	}

	/*
		********************
		Authentication: Listen for auth changes.
		********************
	*/
	auth.onAuthStateChanged(user => {
		if(user) {
			if(user !== currentUser) {
				//console.log("LOGIN !!");

				setUser(user);
				get(child(ref(db), 'user/' + user.uid)).then((snapshot) => {
					if (snapshot.exists()) {
						setUserData(snapshot.val());
					}
				}).catch((error) => {
					//console.error(error);
				})
				
				fetchData(`user`).then((res) => {
					setUsers(res);
				}).catch(e => {
					//console.log(e);
				});

				get(child(ref(db), 'quiz/')).then((snapshot) => {
					if(snapshot.exists()) {
						setFetchQuizzes(Object.values(snapshot.val()));
					}
				}).catch((error) => {
					//console.error(error);
				});
			}
			
		} else {
			if(user !== currentUser) {
				setUser('null');
				setUserData('null');
			}
		}
	});

	// For the first time only, set firebase.database() as CurrentDatabase.
	useEffect(() => {
		if(!init) {
			setInit(true);
			setDatabase(firebase.database());
		}
	}, [ init ]);

	/*
		********************
		Database and Quiz Related Stuff
		Couldn't separate as they use addToast context.
		********************
	*/

	async function updateQuiz(quizCode, quiz, questions) {
		let promise = new Promise(function(res, rej) {
			set(ref(db, `quiz/${quizCode}`), {
				absoluteIndex: quiz.absoluteIndex,
				description: quiz.description,
				duration: quiz.duration,
				issueCount: quiz.issueCount,
				maxScore: quiz.maxScore,
				name: quiz.name,
				owner: quiz.owner,
				questionCount: quiz.questionCount,
				length: questions.length
			}).then(() => {
				addToast('info', 'Save successful!', 'Changes have been saved.', 1);
				res(true);
			}).catch((error) => {
				addToast('error', 'Save failed...', 'Something went wrong.', 1);
				rej(error);
			});
		});
	
		await promise;
	}

	// When currentFetchQuizzes changes (which is after setFetchQuizzes is executed),
	// transform the fetched quizzes into Javascript objects as declared in Question.js.
	useEffect(() => {
		let array = [];
		for(let i = 0; i < currentFetchQuizzes.length; i++) {
			array = [...array, getQuizPackFromJSON(currentFetchQuizzes[i])];
		}
		setQuizzes(array);
	}, [currentFetchQuizzes]);

	/*
		********************
		Functions dealing with a user's quiz collection.
		********************
	*/
	function createQuiz(name, description, duration) {
		get(child(ref(db), 'stats/')).then((snapshot) => {
			if(snapshot.exists()) {
				if(currentUserData && currentUserData.createQuiz >= QUIZ_PER_USER_LIMIT) {
					addToast('error', 'Oops!', 'At the moment, one user can only have 5 quizzes.', 1);
					return;
				}

				const absoluteIndex = snapshot.val()["quizCount"];

				if(absoluteIndex === undefined)
					return;

				const sampleQuestion = new QuestionMC(
					"<p>Sample Question</p>",
					['Choice A', 'Choice B', 'Choice C', 'Choice D', 'Choice E'],
					0,
					10,
					0,
					0
				);

				set(ref(db, `questions/${absoluteIndex}/question/0`), {
					absoluteIndex: 0,
					question: sampleQuestion.question,
					choices: sampleQuestion.choices,
					correct: sampleQuestion.correct,
					score: sampleQuestion.score,
					qid: sampleQuestion.qid,
					type: 'Multiple Choice'
				});

				set(ref(db, `quiz/${absoluteIndex}`), {
					name: name,
					description: description,
					duration: duration,
					absoluteIndex: absoluteIndex,
					questionCount: 1,
					owner: currentUser.uid,
					maxScore: sampleQuestion.score,
					issueCount: 0,
					length: 1
				});
				
				currentDatabase.ref('stats/')
				.child('quizCount')
				.set(firebase.database.ServerValue.increment(1));

				currentDatabase.ref(`user/${currentUser.uid}`)
				.child('createQuiz')
				.set(firebase.database.ServerValue.increment(1));

				history.go(0);
			}
		}).catch((error) => {
			//console.error(error);
		});
	}

	async function updateQuestions(quizCode, changes, questions) {

		// If there are no changes, ignore the save command.
		if(changes.length === 0) {
			return;
		}

		let deleted = [];
		let updated = [];
		let updatedObject = [];
		// let changeCount = changes.length;
		// let difference = 0;

		for(let i = changes.length - 1; i >= 0; i--) {

			// "If it's going to be deleted, why bother change/update it?".
			if(deleted.includes(changes[i]['absoluteIndex'])) {
				// changeCount--;
				continue;
			}

			if(changes[i]['action'] === "delete") {
				// difference--;
				deleted.unshift(changes[i]['absoluteIndex']);
			}

			if(updated.includes(changes[i]['absoluteIndex'])) {
				// changeCount--;
				continue;
			}

			updated.unshift(changes[i]['absoluteIndex']);
			updatedObject.unshift(changes[i]);

			if(changes[i]['action'] === "create") {
				// difference++;
			}
		}

		let rejections = 0;

		// Delete every single questions that are going to be deleted in the end.
		for(let i = 0; i < deleted.length; i++) {
			let promise = new Promise(function(res, rej) {
				set(ref(db, `questions/${quizCode}/question/${deleted[i]}`),
					null
				).then(function() {
					res(0);
				}).catch(function(error) {
					rej(1);
				});
			});
			rejections += await promise;
		}

		async function writeQuestion(question, index) {
			switch(question.type) {
				case 'Multiple Choice':
					set(ref(db, `questions/${quizCode}/question/${index}`), {
						absoluteIndex: question.absoluteIndex,
						choices: question.choices,
						correct: question.correct,
						qid: question.qid,
						question: question.question,
						score: question.score,
						type: question.type
					})
					break;
				default: 
					set(ref(db, `questions/${quizCode}/question/${index}`), {
						absoluteIndex: question.absoluteIndex,
						accept: question.accept,
						qid: question.qid,
						question: question.question,
						score: question.score,
						type: question.type
					});
					break;
			}
		}

		// Dealing with "UPDATED" questions.
		for(let i = 0; i < updated.length; i++) {
			const idx = updatedObject[i].idx;
			
			let promise = new Promise(function(res, rej) {
				writeQuestion(questions[idx], updated[i]).then(() => {
					res(0);
				}).catch((error) => {
					rej(1);
				});
			});
			rejections += await promise;
		}

		if(rejections > 0) {
			addToast('error', 'Save failed...', 'Something went wrong.', 1);
		} else if(rejections === 0) {
			addToast('info', 'Save successful!', 'Changes have been saved.', 1);
		}
	}

	async function deleteQuiz(quizCode) {
		let promise = new Promise(function(res, rej) {
			set(ref(db, `quiz/${quizCode}`), null).then(() => {
				set(ref(db, `questions/${quizCode}`), null).then(() => {
					res(2);
				}).catch(e => {
					rej(1);
				});
			}).catch(e => {
				rej(0);
			});
		});
		
		let result = await promise;

		if(result === 2) {
			currentDatabase.ref(`user/${currentUser.uid}`)
			.child('createQuiz')
			.set(firebase.database.ServerValue.increment(-1));

			setTimeout(() => {
				history.go(0);
			}, 1000);

			addToast('info', 'Delete successful.', 'The selected quiz has been removed.', 0);
		} else {
			addToast('info', 'Delete failed.', 'Something went wrong.', 0);
		}
	}

	async function submitAnswers(quizCode, length, answers, score, maxScore, start) {
		let date = new Date().toLocaleString();

		for(let i = 0; i < length; i++) {
			if(answers[i] === null || answers[i] === undefined)
				answers[i] = "";
		}

		get(child(ref(db), 'stats/')).then((snapshot) => {
			if(snapshot.exists()) {
				const absoluteIndex = snapshot.val()["workCount"];

				if(absoluteIndex === undefined)
					return;

				set(ref(db, `works/${absoluteIndex}`), {
					absoluteIndex: absoluteIndex,
					associatedQuiz: quizCode,
					owner: currentUser.uid,
					answers: answers,
					score: score,
					maxScore: maxScore,
					timeSubmit: date,
					timeStart: start
				});

				currentDatabase.ref('stats/')
				.child('workCount')
				.set(firebase.database.ServerValue.increment(1));

				currentDatabase.ref(`user/${currentUser.uid}`)
				.child('workQuiz')
				.set(firebase.database.ServerValue.increment(1));
			}
		}).catch((error) => {
			//console.error(error);
		});
	}

	/*
		********************
		Modal functions dealing with user accounts (register/login/logout).
		********************
	*/

	function showRegisterForm() {
		showModal( 
			<>
				<h3>Register</h3>
				<Form
					fields={
						'[ \
							{"name":"Email", "type":"email", "rule":"email"}, \
							{"name":"Name", "type":"text", "rule":"length6-48"}, \
							{"name":"Password", "type":"password", "rule":"length6-48"} \
						]'
					}
					id="register-form"
					accountRelated={true}
					addToast={addToast}
					submitIcon="assignment"
					submitText="Register"
					submitAction={register}
				/>
			</>
		, 0.5);
	}

	function showLoginForm() {
		showModal( 
			<>
				<h3>Login</h3>
				<Form
					fields={
						'[ \
							{"name":"Email", "type":"email", "rule":"email"}, \
							{"name":"Password", "type":"password", "rule":"length6-48"} \
						]'
					}
					id="login-form"
					accountRelated={true}
					addToast={addToast}
					submitIcon="login"
					submitText="Login"
					submitAction={() => login(history)}
				/>
			</>
		, 0.5);
	}

	function logout() {
		signOut(getAuth());
	}

	/*
		********************
		Render method.
		********************
	*/
	return (
		<UserContext.Provider value={{currentUser, currentUserData, currentUsers, QUIZ_PER_USER_LIMIT}}>
			<ToastContext.Provider value={{currentToasts, setToasts, addToast}}>
				<div className="App">
					<Navigation
						showRegisterForm={() => showRegisterForm()}
						showLoginForm={() => showLoginForm()}
						user={currentUser}
						userData={currentUserData}
						logout={() => logout()}
					/>
					<Switch>
						<QuizzesContext.Provider value={{currentQuizzes, setQuizzes}}>
							<Route exact path="/">
								{(currentUser === 'null') ? 
									(
										<Landing />
									)
								:
									(
										<Collection mode="public" fetchData={fetchData} createQuiz={createQuiz} deleteQuiz={deleteQuiz}/>
									)
								}
							</Route>
							<Route path="/collection">
								<Collection mode="private" fetchData={fetchData} createQuiz={createQuiz} deleteQuiz={deleteQuiz}/>
							</Route>
							<Route path="/works">
								<Works fetchData={fetchData} getQuizAndQuestions={getQuizAndQuestions} />
							</Route>
							<Route path="/edit">
								<QuizEditor
									getQuizAndQuestions={getQuizAndQuestions}
									updateQuestions={updateQuestions}
									updateQuiz={updateQuiz}
									deleteQuiz={deleteQuiz}/>
							</Route>
							<Route path="/review">
								<QuizReview
									getQuizAndQuestions={getQuizAndQuestions}
									fetchData={fetchData}/>
							</Route>
							<Route path="/results">
								<WorkByQuiz fetchData={fetchData} getQuizAndQuestions={getQuizAndQuestions} />
							</Route>
							<Route path="/work">
								<QuizWorker
									getQuizAndQuestions={getQuizAndQuestions}
									updateQuiz={updateQuiz}
									deleteQuiz={deleteQuiz}
									submitAnswers={submitAnswers}/>
							</Route>
						</QuizzesContext.Provider>
					</Switch>
					<Toasts />
				</div>
			</ToastContext.Provider>
		</UserContext.Provider>
	);
}