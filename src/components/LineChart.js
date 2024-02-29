// React
// import { useState } from "@wordpress/element";
// Charts
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { swellRating } from '../lib/swell';
import { calcPoint, getShortName } from '../lib/direction';
// Date
import * as dayjs from 'dayjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip
);

const GRID_COLOUR = "#FFFFFF";
const GRID_COLOUR_HALF = "#FFFFFF80";

// const swellRating = ( score ) => {
// 	const newLabel = swellLabels.filter( swellLabel => swellLabel.lessThan >= parseFloat( score ) );
	
// 	if( newLabel.length > 0 ) {
// 		return '(' + newLabel[0].label + ')';
// 	}
// 	return '(Calm)';
// }

const LineChart = ( { data, heading, icon, smooth } ) => {
	const labels = Array.isArray( data ) ? data[0].labels : data.labels; 

	const start = Math.min( ...labels );
	const end = Math.max( ...labels );
	
	// Convert timestamp to formated date
	const xAxisCallback = ( tickValue, index, ticks ) => {
		// if( index + 1 === ticks.length ) {
		// 	console.log( 'here' );
		// 	return "";
		// }
		return [
			dayjs( labels[index] ).format( "D MMM" ),
			dayjs( labels[index] ).format( "h:mma" )
		]; // index === 0 ? [] : 
	}

	const generateConfig = ( { xTitle, yTitle } ) => {
		return {
			responsive: true,
			elements: {
				line: {
					tension: smooth
				}
			},
			plugins: {
				legend: false,
				title: {
					display: false,
				},
				tooltip: {
					callbacks: {
						title: ( props ) => {
							const label = parseInt( props[0].label );
							return dayjs( label ).format( "D MMM h:mma" );
						},
						label: ( { dataset, dataIndex: i } ) => {
							switch( dataset.key ) {
								case 'windSpeed':
									return dataset.data[i].y + "kn (" + getShortName( calcPoint(dataset.rotation[i]) ) + ")"; // (" + dataset.rotation[i] + "\u00B0)" + " 
								case 'swellHeight':
									return dataset.data[i].y + "m - " + swellRating( dataset.data[i].y ) + " (" + getShortName( calcPoint(dataset.rotation[i]) ) + ")";
								case 'seasHeight':
									return dataset.data[i].y + "m";
								case 'surfaceTemperature':
									return dataset.data[i].y + "\u2103"; // Degrees C
								case 'barometer':
									return dataset.data[i].y + "hPa"; // \u3371
								case 'tide':
									return dataset.data[i].y + "m " + dayjs(  dataset.data[i].x ).format( "h:mma" );
								case 'period':
									return dataset.data[i].y + "s"; // \u3371
							}
						}
					}
				}
			},
			scales: {
				x: {
					time: {
						tooltipFormat: "DD T HH:mm"
					},
					title: {
						display: true,
						color: GRID_COLOUR,
						text: xTitle
					},
					ticks: {
						maxTicksLimit: 7,
						align: 'end',
						autoSkip: true,
						maxRotation: 0,
						color: GRID_COLOUR,
						callback: xAxisCallback
					},
					reverse: true,
					grid: {
						color: GRID_COLOUR_HALF
					}
				},
				y: {
					type: "linear",
					display: true,
					position: "left",
					id: "y",
					ticks: {
						maxTicksLimit: 6,
						color: GRID_COLOUR
					},
					title: {
						display: true,
						text: yTitle,
						color: GRID_COLOUR
					},
					grid: {
						color: GRID_COLOUR_HALF
					}
				}
			}
		}
	}

	// Arrow icons
	let point = {};
	if( Array.isArray( data ) ) {
		if( data[0].datasets[0].rotation && icon ) {
			let arrow = new Image( 16, 16 );
			arrow.src = icon;
			point = { radius: 10 }; // pointStyle: arrow, 
		}
		else {
			point = { pointStyle: 'circle' };
		}
	}
	else {
		if( data.datasets[0].rotation && icon ) {
			let arrow = new Image( 16, 16 );
			arrow.src = icon;
			point = { radius: 10 }; // pointStyle: arrow, 
		}
		else {
			point = { pointStyle: 'circle' };
		}
	}

	// Check if data is array
	let datasets = [];
	if( Array.isArray( data ) ) {
		datasets = [
			{ ...data[0].datasets[0], borderColor: "#00000080", ...point, tension: smooth },
			{ ...data[1].datasets[0], borderColor: "#00000080", ...point, tension: smooth }
		];
	}
	else {
		datasets = [
			{ ...data.datasets[0], borderColor: "#00000080", ...point, tension: smooth }
		];
	}

	return (
		data && (
			<Line
				options={ generateConfig( { 
					xTitle: dayjs( start ).format( "D MMM YYYY" ) + " - " + dayjs( end ).format( "D MMM YYYY" ),
					yTitle: heading
				} ) } 
				data={ { 
					...data, 
					datasets: datasets
				} } 
			/>
		)
	);
}

export default LineChart;