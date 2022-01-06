/*
React Stuff
*/
import React, { useState, useEffect } from 'react';

/*
Imports from Other .js Files
*/
import { closeModal } from '../Components/Modal.js';
import Button from '../Components/Button.js';
import { handleUndefined } from '../Utility.js';

/*
CSS Imports
*/
import '../css/Modal.css';

function preprocess(string) {
	return string.toLowerCase().replace(' ','-');
}

export function Input(props) {
	function validateInput(rule, value) {
		let verdict = true; // True means that there is an issue.
		let message = null;

		if(rule.includes("length")) { //lengthX-Y, where X represents min length and Y max length.
			const regex = /\d+/g;
			const parse = rule.match(regex); //would be an array with size two.

			const minLength = handleUndefined(parse[0], 6); //Defaults to 6 if not defined
			const maxLength = handleUndefined(parse[1], 50); //Defaults to 50 if not defined

			if(value.length >= minLength && maxLength >= value.length) {
				verdict = false;
			} else {
				if(value.length < minLength) {
					message = `${props.name} must be at least ${minLength} characters long.`;
				}
				if(value.length > maxLength) {
					message = `${props.name} must be at most ${maxLength} characters long.`;
				}
			}
		} else if(rule.includes("alphanumeric")) {
			const regex = /^[0-9a-zA-Z]+$/;
			if(value.match(regex)) {
				verdict = false;
			} else {
				message = `${props.name} should be alphanumeric.`;
			}
		} else if(rule.includes('value')){
			value = parseInt(value);
			const regex = /\d+/g;
			const parse = rule.match(regex);

			const minValue = handleUndefined(parse[0], 1);
			const maxValue = handleUndefined(parse[1], 100);
			if(value >= minValue && maxValue >= value) {
				verdict = false;
			} else {
				if(value < minValue) {
					message = `${props.name} must be at least ${minValue}.`;
				}
				if(value > maxValue) {
					message = `${props.name} must be at most ${maxValue}.`;
				}
			}
			
		} else if(rule.includes('email')){
			// Reference: https://stackoverflow.com/a/32686261
			const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if(value.match(regex)) {
				verdict = false;
			} else {
				message = `This is not an appropriate email!`;
			}
		}

		if(value === "" || isNaN(value) === true) {
			message = `${props.name} must not be empty!`;
		}

		if(verdict === false) {
			message = "";
		}

		props.reportVerdict(props.idx, verdict, message);
		return verdict;
	}

	function getRules() {
		const id = preprocess(props.name);

		if(document.getElementById(id) === null)
			return;
		
		const value = document.getElementById(id).value;
		
		let rules = props.rule.split(";");

		rules.forEach((rule) => {
			validateInput(rule, value);
		});
	}

	let inputElement;
	if(props.type === "textarea") {
		inputElement = (
			<textarea className="modal-input" id={preprocess(props.name)} name={preprocess(props.name)} onBlur={getRules} disabled={props.disabled}/>
		);
	} else {
		inputElement = (
			<input className="modal-input" id={preprocess(props.name)} name={preprocess(props.name)} type={props.type} onBlur={getRules} disabled={props.disabled}/>
		);
	}

	return (
		<div className="input-wrapper">
			<h4>{props.name}</h4>
			{inputElement}
		</div>
	);
}

function ErrorList(props) {
	let combinedIssues = props.currentIssues;

	if(props.currentAuthIssue !== undefined)
		combinedIssues = [...combinedIssues, props.currentAuthIssue];

	const issues = combinedIssues.map((data, idx) =>
		<li key={idx + '/' + data['verdict'] + '/' + data['message']} className={(data["verdict"] === true && data["message"] !== null && data["message"].length > 0) ? "input-error" : "hidden"}>{handleUndefined(data["message"], "")}</li>
	);

	return (
		<ul>
			{issues}
		</ul>
	);
}

export function Form(props) {

	let [currentIssues, setIssues] = useState([]);
	let [currentAuthIssue, setAuthIssue] = useState();
	const currentFields = JSON.parse(props.fields);
	let [init, setInit] = useState(false);

	const disabled = handleUndefined(props.disabled, false);
	const accountRelated = handleUndefined(props.accountRelated, false);

	useEffect(() => {
		if(!init) {
			setInit(true);
			
			for(let i = 0; i < currentFields.length; i++) {
				currentIssues[i] = {
					verdict: true,
					message: null
				};
			}
		}
	}, [ currentFields, currentIssues, init ]);

	const msgTop = document.getElementById('modal-msgTop');
	const msgBottom = document.getElementById('modal-msgBottom');

	if(msgTop && props.msgTop)
		msgTop.innerHTML = props.msgTop;
	if(msgBottom && props.msgBottom)
		msgBottom.innerHTML = props.msgBottom;


	function calculateIssues() {
		let issues = 0;

		for(let i = 0; i < currentFields.length; i++) {
			if(currentFields[i]["rule"] !== "") {
				issues++;
			}
		}

		for(let i = 0; i < currentFields.length; i++) {
			if(currentIssues[i] && currentIssues[i]["verdict"] === false) {
				issues--;
			}
		}
		
		const prefilled = handleUndefined(props.prefilled, false);

		if(prefilled === true) {
			issues = 0;
		}

		return issues;
	}

	function reportVerdict(idx, verdict, message=null) {
		let tempIssues = [...currentIssues];
		
		tempIssues[idx] = {
			verdict: verdict,
			message: message
		};

		setIssues(tempIssues);
	}

	function validateForm() {
		const issues = calculateIssues();

		if(disabled === true) {
			props.submitAction();
		}

		if(issues === 0) {
			if(accountRelated === true) {
				async function asyncAction() {
					let result = await props.submitAction();
					return result;
				}

				function errorCodeToMessage(code) {
					let message;

					switch(code) {
						case "auth/email-already-in-use":
							message = "That email is already in use!";
							break;
						case "auth/wrong-password":
							message = "Wrong password.";
							break;
						case "auth/user-not-found":
							message = "User is not found.";
							break;
						default:
							message = "Something wrong happened. Please try again later.";
							break;
					}
					return message;
				}

				asyncAction().then((error) => {
					if(error === null)
						return;

					//console..log(error);
					let message = errorCodeToMessage(error.code);

					if(error !== null) {
						setAuthIssue({
							verdict: true,
							message: message
						});
					} else {
						setAuthIssue({
							verdict: false,
							message: null
						});
					}
				});
			} else {
				props.submitAction();
			}
		} else {
			if(props.addToast !== null && props.addToast !== undefined)
				props.addToast("error", "Hey!", "There are unresolved issues!", 1);
		}
	}

	const fields = currentFields.map((data, idx) => 
		<Input 
			key={data.name + "//" + data.type + "//" + data.rule}
			idx={idx}
			name={data.name} 
			type={data.type}
			rule={data.rule}
			disabled={disabled}
			reportVerdict={reportVerdict}
		/>
	);

	let exitButton;
	if(disabled === false) {
		exitButton = (
			<Button variant="outline" text="Exit" trigger={closeModal}/>
		);
	} else {
		exitButton = (
			<>
			</>
		);
	}

	return (
		<form id={props.id}>
			<p id="modal-msgTop"></p>
			{fields}
			<ErrorList currentIssues={currentIssues} currentAuthIssue={currentAuthIssue}/>
			<p id="modal-msgBottom"></p>
			<div className="modal-group">
				<Button color="btn-info" startIcon={props.submitIcon} text={props.submitText} trigger={() => validateForm()}/>
				{exitButton}
			</div>
		</form>
	);
}