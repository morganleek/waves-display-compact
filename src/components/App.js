import { useEffect, useState } from "@wordpress/element";
import axios from '../lib/axios';
// import classNames from 'classnames'
// import { useForm } from "react-hook-form";
import { ReactComponent as IconLoading } from '../images/fade-stagger-squares.svg';
import { ReactComponent as IconWind } from '../images/icon-wind.svg';
import { ReactComponent as IconSwell } from '../images/icon-swell.svg';
import { ReactComponent as IconTide } from '../images/icon-tide.svg';
import { ReactComponent as IconSeaState } from '../images/icon-sea-state.svg';
import { ReactComponent as IconTemperature } from '../images/icon-temperature.svg';
import { ReactComponent as IconBarometer } from '../images/icon-barometer.svg';
// Charts
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
// Date
import * as dayjs from 'dayjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const degreesToDirection = degrees => {
	const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
	const reverse = ( parseInt(degrees) + 180 ) % 360;
	const rough = ( reverse + ( 360 + 22.5 ) ) % 360; // Move 22.5 degrees counter clockwise
	const section = Math.floor( rough / 45 ); // Narrow to 1 of 8 directions
	return directions[section];
}

function App(props) {
	const [buoys, setBuoys] = useState([]);
	const [selectedBuoy, setSelectedBuoy] = useState(null);

	useEffect(() => {
		// Fetch all buoys
		if (buoys.length == 0) {
			axios
				.get('/wp-admin/admin-ajax.php?action=waf_rest_list_buoys')
				.then(response => {
					if (response.status == 200) {
						// Setup buoys
						setBuoys(response.data);
					}
				})
				.catch((e) => { console.debug(e); });
		}
	}, []);

	const updateBuoy = (buoyId) => {
		// Set ID except when reselecting the default 
		if (buoyId > 0) {
			// Set current buoy
			// setSelectedBuoy(buoyId);
			// Fetch buoy values
			axios.get('/wp-admin/admin-ajax.php?action=waf_rest_list_buoy_datapoints', {
					params: {
						id: buoyId
					}
				})
				.then(response => {
					
					if (response.status == 200) {
						const buoyDataPoints = response.data.data;
						// Most recent event
						let processedData = {};
						// Data types
						const dataTypes = [
							{ label: "Surface Temperature", col: "SST (degC)", key: "surfaceTemperature" }, 
							{ label: "Wind Speed", col: "WindSpeed (m/s)", key: "windSpeed" },
							{ label: "Swell", col: "Hsig (m)", key: "swellHeight" }
						]
						// Chart data structure
						let chartData = {};
						dataTypes.forEach( type => {
							const { key } = type;
							chartData[key] = {
								datasets: [ { data: [] } ],
								labels: []
							}
						} );

						// let chartData = {
						// 	windSpeed: {
						// 		datasets: [ { data: [] } ],
						// 		labels: []
						// 	},
						// 	swellHeight: {
						// 		datasets: [ { data: [] } ],
						// 		labels: []
						// 	},
						// 	surfaceTemperature: {
						// 		datasets: [ { data: [] } ],
						// 		labels: []
						// 	}
						// };
						if( buoyDataPoints.length > 0 ) {
							if( buoyDataPoints[0]?.data_points ) {
								// let processedData = {};
								const unprocessedData = JSON.parse(buoyDataPoints[0]?.data_points);
								processedData.timeStampUTC = unprocessedData['Timestamp (UTC)'];
								processedData.surfaceTemperature = unprocessedData['SST (degC)'] != "-9999.0" ? parseFloat( unprocessedData['SST (degC)'] ) : null;
								processedData.swellHeight = unprocessedData['Hsig (m)'] != "-9999.00" ? parseFloat( unprocessedData['Hsig (m)'] ) : null;
								processedData.swellDirection = unprocessedData['Dm (deg)'] != "-9999.00" ? degreesToDirection( unprocessedData['Dm (deg)'] ): null;
								processedData.windDirection = unprocessedData['WindDirec (deg)'] != "-9999.00" ? degreesToDirection( unprocessedData['WindDirec (deg)'] ) : null;
								processedData.windSpeed = unprocessedData['WindSpeed (m/s)'] != "-9999.00" ? parseFloat( unprocessedData['WindSpeed (m/s)'] ) : null;
							}

							

							// Wind Speed
							buoyDataPoints.forEach( buoy => {
								const rawData = JSON.parse(buoy.data_points);

								// Process for each data type
								dataTypes.forEach( type => {
									const { col, key } = type;
									const value = rawData[col];
									if( value != "NaN" && parseInt(value) != -9999 ) {
										chartData[key].datasets[0].data.push( { x: parseInt( buoy.timestamp ) * 1000, y: parseFloat( rawData[col] ) } );
										chartData[key].labels.push( parseInt( buoy.timestamp ) * 1000 );
									}
								} );

								// Windspeed
								// if( 
								// 	rawData['WindSpeed (m/s)'] != "NaN" 
								// 	&& parseFloat( rawData['WindSpeed (m/s)'] ) >= 0.0 
								// ) {
								// 	chartData.windSpeed.datasets[0].data.push( { x: parseInt( buoy.timestamp ) * 1000, y: parseFloat( rawData['WindSpeed (m/s)'] ) } );
								// 	chartData.windSpeed.labels.push( parseInt( buoy.timestamp ) * 1000 );
								// }
								// Surface Temperature
								// if( 
								// 	parseFloat( rawData['SST (degC)'] ) != 9999.0
								// 	&& rawData['SST (degC)'] != "NaN"
								// ) {
								// 	chartData.surfaceTemperature.datasets[0].data.push( { x: parseInt( buoy.timestamp ) * 1000, y: parseFloat( rawData['SST (degC)'] ) } );
								// 	chartData.surfaceTemperature.labels.push( parseInt( buoy.timestamp ) * 1000 );
								// }
							} );
						}
						
						setSelectedBuoy( {
							buoyId,
							processedData, 
							chartData 
						} );
						// Setup buoys
						// setSelectedBuoy( { ...response.data, processedData, chartData } );
					}
				})
				.catch((e) => { console.debug(e); });
		}
	};

	const windSpeedXAxisCallback = ( tickValue, index, ticks ) => {
		console.log( ticks );
		return [
			dayjs( ticks[index].value ).format( "D MMM" ),
			dayjs( ticks[index].value ).format( "HH:mm" )
		];
	}

	const toolTipLabelsCallback = ( tooltipItem ) => {
		const { dataIndex, dataset } = tooltipItem;

		return 'Hello';
	}

	const windSpeedOptions = {
		responsive: true,
		plugins: {
			legend: false,
			title: {
				display: false,
			},
			callbacks: {
				label: toolTipLabelsCallback,
			}
		},
		scales: {
			x: {
			// 	type: 'linear',
				time: {
					tooltipFormat: "DD T HH:mm"
				},
				title: {
					display: true,
					color: "#000",
					text: "Time Range"
				},
				ticks: {
					maxTicksLimit: 7,
					autoSkip: false,
					maxRotation: 0,
					color: "#000",
					callbacks: windSpeedXAxisCallback
				},
				grid: {
					tickColor: "#000",
					color: "#e1e1e1"
				}
			},
			yAxis: {
				type: "linear",
				display: true,
				position: "left",
				id: "y",
				gridLines: {
					drawOnChartArea: false
				},
				ticks: {
					// beginAtZero: true,
					// min: 0,
					// max: 25,
					maxTicksLimit: 6,
					color: "#000"
				},
				title: {
					display: true,
					text: "Wind Speed",
					color: "#000"
				},
				grid: {
					tickColor: "#000",
					color: "#e1e1e1",
					drawOnChartArea: false
				}
			}
		}
	};

	return (
		buoys.length > 0
			? (
				<>
					<div className="heading">
						{ selectedBuoy
							? <h4>{ buoys.filter( buoy => parseInt(buoy.id) == selectedBuoy.buoyId ).map( buoy => buoy.web_display_name ) }</h4>
							: undefined
						}
						<div className="selector">
							<select onChange={e => updateBuoy(e.target.value)}>
								<option value="0">Select a buoy</option>
								{buoys.map((buoy, i) => (
									<option key={i} value={buoy.id}>{buoy.web_display_name}</option>
								))}
							</select>
						</div>
					</div>
					{ !selectedBuoy
						? <div className="map"></div>
						: (
							<div className="latest-observations">
								<h4>Latest observations</h4>
								<div className="observations">
									<div className="observation wind">
											<h5>Wind</h5>
										<div class="metric">
											<h6 className="label">Direction</h6>
											<p>{ selectedBuoy.processedData.windDirection
												? selectedBuoy.processedData.windDirection
												: "-" 
											}</p>
										</div>
										<div class="metric">
											<h6 className="label">Speed</h6>
											<p>{ selectedBuoy.processedData.windSpeed
												? selectedBuoy.processedData.windSpeed + " m/s" 
												: "-" 
											}</p>
										</div>
									</div>
									<div className="observation swell">
										<h5>Swell</h5>
										<div class="metric">
											<h6 className="label">Direction</h6>
											<p>{ selectedBuoy.processedData.swellDirection
												? selectedBuoy.processedData.swellDirection
												: "-" 
											}</p>
										</div>
										<div class="metric">
											<h6 className="label">Height</h6>
											<p>{ selectedBuoy.processedData.swellHeight 
												? selectedBuoy.processedData.swellHeight + " m" 
												: "-" 
											}</p>
										</div>
									</div>
									<div className="observation-small sea-state">
										<h5>Sea State <span className="icon"><IconSeaState /></span></h5>
										<p>-</p>
									</div>
									<div className="observation-small sea-state">
										<h5>Surface Temp <span className="icon"><IconTemperature /></span></h5>
										<p>{ selectedBuoy.processedData.surfaceTemperature 
											? selectedBuoy.processedData.surfaceTemperature + String.fromCharCode(176) 
											: "-" 
										}</p>
									</div>
									<div className="observation-small sea-state">
										<h5>Tide <span className="icon"><IconTide /></span></h5>
										<p>-</p>
									</div>
									<div className="observation-small sea-state">
										<h5>Barometer <span className="icon"><IconBarometer /></span></h5>
										<p>-</p>
									</div>
								</div>
								<div className="coastal-warnings">
									<p>Check BOM Coastal Warnings</p>
								</div>
								<h4>Historical Observations</h4>
								<div className="historic-observations">
									<div className="chart-wrapper">
										<h5>Wind <span className="icon"><IconWind /></span></h5>
										<p>Chart</p>
									</div>
									<div className="chart-wrapper">
										<h5>Swell <span className="icon"><IconSwell /></span></h5>
										<Line 
											options={ windSpeedOptions } 
											data={ selectedBuoy.chartData.swellHeight } 
										/>
									</div>
									<div className="chart-wrapper">
										<h5>Seas <span className="icon"><IconSeaState /></span></h5>
										<p>Chart</p>
									</div>
									<div className="chart-wrapper">
										<h5>Wind <span className="icon"><IconWind /></span></h5>
										<Line 
											options={ windSpeedOptions } 
											data={ selectedBuoy.chartData.windSpeed } 
										/>
									</div>
									<div className="chart-wrapper">
										<h5>Surface Temperature <span className="icon"><IconTemperature /></span></h5>
										<Line 
											options={ windSpeedOptions } 
											data={ selectedBuoy.chartData.surfaceTemperature } 
										/>
									</div>
									<div className="chart-wrapper">
										<h5>Tide <span className="icon"><IconTide /></span></h5>
										<p>Chart</p>
									</div>
									<div className="chart-wrapper">
										<h5>Barometer <span className="icon"><IconBarometer /></span></h5>
										<p>Chart</p>
									</div>
								</div>
							</div>
						)
					}
				</>
			)
			: <div className="loading"><IconLoading /></div>
	);
}

export default App;

