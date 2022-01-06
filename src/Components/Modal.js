/*
React
*/
import React from 'react';
import ReactDOM from 'react-dom';

/*
CSS Imports
*/
import '../css/Modal.css';

function Modal(props) {
    return (
        <div className="question-card">
            {props.content}
        </div>
    );
}

export function showModal(element, opacity) {
    let modal = document.createElement('div');
    modal.id = "modal-background";

    if(element === undefined)
        return;

    if(opacity > 0.5)
        modal.className = "modal-full-hidden"
    else
        modal.className = "modal-partial-hidden"

    if(document.getElementById("modal-background"))
        document.getElementById("modal-background").remove();

    if(document.getElementsByClassName("App")[0])
        document.getElementsByClassName("App")[0].appendChild(modal);

    if(document.getElementById("modal-background"))
        ReactDOM.render(
            <Modal content={element}/>,
            document.getElementById("modal-background")
        );
}

export function closeModal() {
    if(document.getElementById("modal-background"))
        document.getElementById("modal-background").remove();
}