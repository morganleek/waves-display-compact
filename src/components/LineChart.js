// React
// import { useState } from "@wordpress/element";
// Charts
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { swellRating } from '../lib/swell';
import { getSimpleDirection } from '../lib/direction';
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

const LineChart = ( { data, heading, headingTwo, icon, smooth } ) => {
	const labels = Array.isArray( data ) ? data[0].labels : data.labels; 

	const start = Math.min( ...labels );
	const end = Math.max( ...labels );
	
	// Convert timestamp to formated date
	const xAxisCallback = ( tickValue, index, ticks ) => {
		return [
			dayjs( labels[index] ).format( "D MMM" ),
			dayjs( labels[index] ).format( "h:mma" )
		]; // index === 0 ? [] : 
	}

	const generateConfig = ( { xTitle, yTitle, yTitleTwo } ) => {
		const config = {
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
									return dataset.data[i].y + "kn (" + getSimpleDirection( dataset.rotation[i] ) + ") " + dataset.rotation[i] + "\u00B0";
								case 'swellHeight':
									return dataset.data[i].y + "m - " + swellRating( dataset.data[i].y ) + " (" + getSimpleDirection( dataset.rotation[i] ) + ")";
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
		};

		if( yTitleTwo ) {
			config.scales.y1 = {
				type: 'linear',
        display: true,
        position: 'right',
				id: "y1",
				ticks: {
					maxTicksLimit: 6,
					color: GRID_COLOUR
				},
        title: {
					display: true,
					text: yTitleTwo,
					color: GRID_COLOUR
				},
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
			}
		}

		return config;
	}

	// Arrow icons
	let point = {};
	if( Array.isArray( data ) ) {
		if( data[0].datasets[0].rotation.length > 0 && icon ) {
			// let arrow = new Image( 16, 16 );
			// arrow.src = icon;
			point = { radius: 10 }; // pointStyle: arrow, 
		}
		else {
			point = { pointStyle: 'circle' };
		}
	}
	else {
		if( data.datasets[0].rotation.length > 0 && icon ) {
			// let arrow = new Image( 16, 16 );
			// arrow.src = icon;
			point = { radius: 10 }; // pointStyle: arrow, 
		}
		else {
			point = { pointStyle: 'circle' };
		}
	}

	// Check if data is array
	let finalData;
	if( Array.isArray( data ) ) {

		finalData = { 
			...data[0], 
			datasets: [
				{ ...data[0].datasets[0], borderColor: "#00000090", ...point, tension: smooth, yAxisID: "y" },
				{ ...data[1].datasets[0], borderColor: "#FFFFFFAA", radius: 3, tension: smooth, yAxisID: "y1" }
			]
		};
	}
	else {
		finalData = { 
			...data, 
			datasets: [
				{ ...data.datasets[0], borderColor: "#00000080", ...point, tension: smooth }
			]
		};
	}

	const finalConfig = generateConfig( { 
		xTitle: dayjs( start ).format( "D MMM YYYY" ) + " - " + dayjs( end ).format( "D MMM YYYY" ),
		yTitle: heading,
		yTitleTwo: Array.isArray( data ) && headingTwo ? headingTwo : undefined // Second Y Axis Label
	} );

	return (
		data && (
			<Line
				options={ finalConfig } 
				data={ finalData } 
			/>
		)
	);
}

export default LineChart;