// React
// import { useState } from "@wordpress/element";
// Charts
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
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

const LineChart = ( { data, heading, icon, smooth } ) => {
	const start = Math.min( ...data.labels );
	const end = Math.max( ...data.labels ); // ).format( "D MMM YYYY" );
	
	// Convert timestamp to formated date
	const xAxisCallback = ( tickValue, index, ticks ) => {
		// if( index + 1 === ticks.length ) {
		// 	console.log( 'here' );
		// 	return "";
		// }
		return [
			dayjs( data.labels[index] ).format( "D MMM" ),
			dayjs( data.labels[index] ).format( "h:mma" )
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
						title: ( { label } ) => {
							return dayjs( label ).format( "D MMM h:mma" );
						},
						label: ( { dataset, datasetIndex: i } ) => {
							switch( dataset.key ) {
								case 'windSpeed':
									return dataset.data[i].y + "m/s (" + dataset.rotation[i] + "\u00B0)";
								case 'swellHeight':
								case 'seasHeight':
									return dataset.data[i].y + "m";
								case 'surfaceTemperature':
									return dataset.data[i].y + "\u2103"; // Degrees C
								case 'barometer':
									return dataset.data[i].y + "hPa"; // \u3371
								case 'tide':
									return dataset.data[i].y + "m " + dayjs(  dataset.data[i].x ).format( "h:mma" );
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
	if( data.datasets[0].rotation && icon ) {
		let arrow = new Image( 16, 16 );
		arrow.src = icon;
		point = { radius: 10 }; // pointStyle: arrow, 
	}
	else {
		point = { pointStyle: 'circle' };
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
					datasets: [
						{ ...data.datasets[0], borderColor: "#00000080", ...point, tension: smooth }
					]
				} } 
			/>
		)
	);
}

export default LineChart;