// export const calcPoint = input => {
// 	// Switch dir
// 	// input = ( input + 180 ) % 360;

// 	input = input / 11.25;
// 	input = input + 0.5 | 0;

// 	var j = input % 8,
// 			input = (input / 8)|0 % 4,
// 			cardinal = ['north', 'east', 'south', 'west'],
// 			// pointDesc = ['1', '1 by 2', '1-C', 'C by 1', 'C', 'C by 2', '2-C', '2 by 1'],
// 			pointDesc = ['1', '1 2', '1-C', 'C 1', 'C', 'C 2', '2-C', '2 1'],
// 			str1, str2, strC;

// 	str1 = cardinal[input];
// 	str2 = cardinal[(input + 1) % 4];
// 	strC = (str1 == cardinal[0] | str1 == cardinal[2]) ? str1 + str2 : str2 + str1;
// 	return pointDesc[j].replace(1, str1).replace(2, str2).replace('C', strC);
// }

// export const getShortName = name => {
// 	return name.replace(/north/g, "N").replace(/east/g, "E").replace(/south/g, "S").replace(/west/g, "W").replace(/by/g, "b").replace(/[\s-]/g, "");
// }

export const getSimpleDirection = ( degrees ) => {
	const directions = [
		'N',
		'N/NE',
		'NE',
		'E/NE',
		'E',
		'E/SE',
		'SE',
		'S/SE',
		'S',
		'S/SW',
		'SW',
		'W/SW',
		'W',
		'N/NW',
		'NW',
		'N/NW',
	];
	const quadrant = Math.floor(
		( ( parseFloat( degrees ) + 11.5 ) % 360 ) / 22.5
	);
	return quadrant < directions.length + 1 ? directions[ quadrant ] : '-';
};
