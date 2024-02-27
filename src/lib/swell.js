const swellLabels = [
	{ lessThan: 0.5,  class: 'calm', label: 'Calm',       colour: 'Light Green' },
	{ lessThan: 1.25, class: 'slight', label: 'Slight',     colour: 'Green' },
	{ lessThan: 2.5,  class: 'moderate', label: 'Moderate',   colour: 'Orange' },
	{ lessThan: 4,    class: 'rough', label: 'Rough',      colour: 'Red' },
	{ lessThan: 6,    class: 'very-rough', label: 'Very Rough', colour: 'Red' },
	{ lessThan: 100,  class: 'extreme', label: 'Extreme',    colour: 'Black '}
];

export const swellRating = ( score ) => {
	const newLabel = swellLabels.filter( swellLabel => swellLabel.lessThan >= parseFloat( score ) );
	
	if( newLabel.length > 0 ) {
		return newLabel[0].label;
	}
	return '(Calm)';
}

export const swellClass = ( score ) => {
	const newLabel = swellLabels.filter( swellLabel => swellLabel.lessThan >= parseFloat( score ) );
	
	if( newLabel.length > 0 ) {
		return newLabel[0].class;
	}
	return 'calm';
}