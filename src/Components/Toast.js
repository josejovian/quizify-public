
import '../css/Toast.css';
import React from 'react';
import { useState, useEffect } from 'react';
import { ToastContext } from '../App.js';

export class Toast {
	constructor(type, title, description, life) {
		this.type = type;
		this.title = title;
		this.description = description;
		this.life = life;
	}
}
export default function Toasts() {
	let [currentLife, setLife] = useState(null);
	// let initialLife = 0;
	// let initialized = 0;
	let [currentWork, setWork] = useState(null);
	let [currentClass, setClass] = useState('');
	let [completion, setComp] = useState(0);
    let {currentToasts, setToasts} = React.useContext(ToastContext);

	function color(type) {
		switch(type) {
			case "validation":
				return "#2ecc71"
			case "info":
				return "#3498db"
			case "error":
				return "#e74c3c"
			case "danger":
				return "#f1c40f"
			default:
				return "white"
		}
	}

	useEffect(() => {
		if(currentToasts.length >= 1 && currentWork === null) {
			setWork(currentToasts[0]);
			// initialLife = (currentToasts[0].life + 1) * 1000;
			setLife((currentToasts[0].life + 1) * 100);
			setClass(currentToasts[0].type + " fadein");
		}
		if(currentWork !== null) {
			setTimeout(() => {
				if(currentLife > 1) {
					// initialized = 1;
					setLife(currentLife - 1);
					setComp(Math.floor(100*(currentLife - 2)/((currentToasts[0].life + 1)*100)));
					// getClass = currentWork.type;
				} else if(currentLife === 1) {
					setLife(currentLife - 1);
					if(document.getElementById('toast') !== null)
						document.getElementById('toast').className += " fadeout";
					setTimeout(() => {
						setToasts(currentToasts.filter((val, idx) => {
							return idx !== 0;
						}));
						setClass('hidden');
						setWork(null);
					}, 1000);
				}
			}, 10);
		}
	}, [currentToasts, currentWork, currentLife, setToasts]);

	if(currentWork !== null) {
		return (
			<div id="toast-container">
				<div id="toast" className={ currentClass } style={{
					borderTop: 2 + "px solid",
					borderImageSlice: 1,
					borderWidth: 4 + "px",
					borderImageSource: 'linear-gradient(90deg, ' + color(currentClass.split(' ')[0]) + ' ' + (completion - 1) + '%, rgba(57,62,70,1)' + (completion) + '%, rgba(57,62,70,1) 100%)'
					}}
					>
					<span className="material-icons">
						{ currentWork.type } 
					</span>
					<div className="text-region">
						<span className="title">
							{ currentWork.title }
						</span>
						<span className="description">
							{ currentWork.description }
						</span>
					</div>
				</div>
			</div>
		);
	} else {
		return (
			<div>
	
			</div>
		);
	}
}