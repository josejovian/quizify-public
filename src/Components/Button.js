/*
Router Stuff
*/
import React from 'react';

/*
Imports from Other .js Files
*/
import { checkUndefined, handleUndefined, handleUndefinedAlt } from '../Utility.js';

/*
CSS Imports
*/
import '../css/Button.css';

export default function Button(props) {

	let getClass = "btn";

	const variant = checkUndefined(props.variant);
	const disableShadow = (props.disableShadow === true) ? "no-shadow" : "";
	const color = checkUndefined(props.color);

	let startIcon = (props.startIcon !== undefined) ? "material-icons material-icons-outlined" : "material-icons";
	let endIcon = (props.endIcon !== undefined) ? "material-icons material-icons-outlined" : "material-icons";
	let conStartIcon = checkUndefined(props.startIcon);
	let conEndIcon = checkUndefined(props.endIcon);

	const size = checkUndefined(props.size);
	const stretch = (props.text !== undefined && props.text.length > 20) ? "condensed" : "";
	const round = checkUndefined(props.round);
	const text = checkUndefined(props.text);
	const align = checkUndefined(props.align);
	const hidden =  checkUndefined(props.hidden);
	const type = handleUndefined(props.type, "button");
	
	if(startIcon === endIcon && startIcon === "") {
		startIcon = endIcon = "hidden";
	}

	if(props.class === undefined) {
		getClass = getClass + " " + variant + " " + disableShadow + " " + color + " " + size + " " + align + " " + stretch + " " + round + " " + hidden;
	} else {
		getClass = getClass + " " + props.class;
	}

	let textClass = "";
	if(props.icon !== undefined) {
		textClass = "material-icons material-icons-outlined"
	} else if(props.startIcon !== undefined) {
		textClass += "btn-text-left";
	} else if(props.endIcon !== undefined) {
		textClass += "btn-text-right";
	}

	if(props.disabled === true) {
		return (
			<button type={type} className={getClass} disabled>
				<span className={handleUndefinedAlt(startIcon, conStartIcon, "hidden")}>{conStartIcon}</span>
				<span className={textClass}>
					{ props.icon !== undefined ? props.icon : text }
				</span>
				<span className={handleUndefinedAlt(endIcon, conEndIcon, "hidden")}>{conEndIcon}</span>
			</button>
		);
	} else {
		return (
			<button type={type} className={getClass} onClick={props.trigger}>
				<span className={handleUndefinedAlt(startIcon, conStartIcon, "hidden")}>{conStartIcon}</span>
				<span className={textClass}>
					{ props.icon !== undefined ? props.icon : text }
				</span>
				<span className={handleUndefinedAlt(endIcon, conEndIcon, "hidden")}>{conEndIcon}</span>
			</button>
		);
	}
}