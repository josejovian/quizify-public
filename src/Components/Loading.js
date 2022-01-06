import React from 'react';

import '../css/Loading.css';

//https://loading.io/css/
export default function Loading() {
	return (
		<div className="loading-container">
			<div className="lds-dual-ring"></div>
		</div>
	);
}