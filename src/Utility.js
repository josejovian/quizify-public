export function checkUndefined(x) {
	return (x !== undefined && x !== null) ? x : "";
}

export function handleUndefinedAlt(x, y, z) {
	return (y !== undefined && y !== null) ? x : z;
}

export function handleUndefined(x, z) {
	return (x !== undefined && x !== null) ? x : z;
}

export function calculateScore(questions) {
	let score = 0;
	for(let i = 0; questions&& i < questions.length; i++) {
		score += questions[i].score;
	}
	return score;
}

export function calculateAnswered(answers) {
	let count = 0;
	for(let i = 0; answers && i < answers.length; i++) {
		if(answers[i] !== null || answers[i] !== '') {
			count++;
		}
	}
	return count;
}
