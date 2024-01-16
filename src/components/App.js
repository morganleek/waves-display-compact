import { useEffect, useState } from "@wordpress/element";
import axios from '../lib/axios';
// import classNames from 'classnames'
// import { useForm } from "react-hook-form";
import { ReactComponent as IconLoading } from '../images/fade-stagger-squares.svg';
import { ReactComponent as IconWind } from '../images/icon-wind-cropped.svg';
import { ReactComponent as IconSwell } from '../images/icon-swell-cropped.svg';
import { ReactComponent as IconTide } from '../images/icon-tide-cropped.svg';
import { ReactComponent as IconSeaState } from '../images/icon-sea-state-cropped.svg';
import { ReactComponent as IconTemperature } from '../images/icon-temperature-cropped.svg';
import { ReactComponent as IconBarometer } from '../images/icon-barometer-cropped.svg';
// Charts
// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
// import { Line } from 'react-chartjs-2';
// Date
import * as dayjs from 'dayjs'
// Map
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Map from './Map';
// Chart Wrapper
import LineChart from "./LineChart";

const mapRender = ( status ) => {
	if( status === Status.FAILURE ) {
		console.debug( 'Map Error' );
		return;
	}
	return <IconLoading />;
}

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

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
	const [mapDetails, setMapDetails] = useState(null);

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

		// Fetch Map details
		axios
			.get('/wp-json/wac/v1/map')
			.then(response => {
				if (response.status == 200) {
					setMapDetails( response.data );
				}
			})
			.catch( e => { console.debug(e) } );
	}, []);

	const updateBuoy = (buoyId) => {
		// Set ID except when reselecting the default 
		if (buoyId > 0) {
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
							{ label: "Swell", col: "Hsig (m)", key: "swellHeight", rotate: "Dm (deg)" }
						]
						// Chart data structure
						let chartData = {};
						dataTypes.forEach( type => {
							const { key } = type;
							chartData[key] = {
								datasets: [ { data: [], rotation: [] } ],
								labels: []
							}
						} );

						// dataPoints.tp.rotation.push( reverseRotation( wave[] ) );

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
										if( type.rotate ) {
											chartData[key].datasets[0].rotation.push( parseFloat( rawData[type.rotate] ) );
										}
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
						? (
							<div className="map-wrapper">
								{ mapDetails && (
									<Wrapper apiKey={ mapDetails.maps_key } render={ mapRender }>
										<Map 
											zoom={ 16 }
											center={ {
												lat: parseFloat( mapDetails.maps_lat_min ), 
												lng: parseFloat( mapDetails.maps_lng_min )
											} }
											bounds={ {
												east: parseFloat( mapDetails.maps_lng_max ), north: parseFloat( mapDetails.maps_lat_min),
												west: parseFloat( mapDetails.maps_lng_min ), south: parseFloat( mapDetails.maps_lat_max )
											} }
											markers={
												buoys.map( buoy => ({ lat: parseFloat( buoy.lat ), lng: parseFloat( buoy.lng ) }) )
											}
											icon={
												mapDetails.maps_marker_icon
											}
										/>
									</Wrapper>
								) }
							</div>
						)
						: (
							<div className="latest-observations">
								<h4>Latest observations</h4>
								<div className="observations">
									<div className="observation wind">
											<h5>Wind <IconWind /></h5>
										<div class="metric">
											<h6 className="label">Direction</h6>
											<p>{ selectedBuoy.processedData.windDirection
												? selectedBuoy.processedData.windDirection
												: "-" 
											}</p>
										</div>
										<div class="metric">
											<h6 className="label">Speed (m/s)</h6>
											<p>{ selectedBuoy.processedData.windSpeed
												? selectedBuoy.processedData.windSpeed 
												: "-" 
											}</p>
										</div>
									</div>
									<div className="observation swell">
										<h5>Swell <IconSwell /></h5>
										<div class="metric">
											<h6 className="label">Direction</h6>
											<p>{ selectedBuoy.processedData.swellDirection
												? selectedBuoy.processedData.swellDirection
												: "-" 
											}</p>
										</div>
										<div class="metric">
											<h6 className="label">Height (m)</h6>
											<p>{ selectedBuoy.processedData.swellHeight 
												? selectedBuoy.processedData.swellHeight 
												: "-" 
											}</p>
										</div>
									</div>
									<div className="observation-small sea-state">
										<h5>Sea State <span className="icon"><IconSeaState /></span></h5>
										<p className="level-moderate">Moderate</p>
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
										<h5><span className="icon"><IconWind /></span> Wind</h5>
										<LineChart
											data={ selectedBuoy.chartData.windSpeed }
											heading={ "Wind Speed (m/s)" }
										/>
									</div>
									<div className="chart-wrapper">
										<h5><span className="icon"><IconSwell /></span> Swell</h5>
										<LineChart
											data={ selectedBuoy.chartData.swellHeight }
											heading="Swell (m)"
										/>
									</div>
									<div className="chart-wrapper">
										<h5><span className="icon"><IconSeaState /></span> Seas</h5>
										<LineChart
											data={ selectedBuoy.chartData.swellHeight }
											heading="Swell (m)"
										/>
									</div>
									<div className="chart-wrapper">
										<h5><span className="icon"><IconTemperature /></span> Surface Temperature</h5>
										<LineChart
											data={ selectedBuoy.chartData.surfaceTemperature }
											heading={ "Temperature (\u2103)" }
										/>
									</div>
									<div className="chart-wrapper">
										<h5><span className="icon"><IconTide /></span> Tide</h5>
										<p>Chart</p>
									</div>
									<div className="chart-wrapper">
										<h5><span className="icon"><IconBarometer /></span> Barometer</h5>
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

