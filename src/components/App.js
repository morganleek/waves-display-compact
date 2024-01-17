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

// Map
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Map from './Map';
// Chart Wrapper
import LineChart from "./LineChart";

const generateArrow = ( fill ) => {
	return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 52" style="enable-background:new 0 0 46 52" xml:space="preserve"><path fill="' + fill + '" d="M33.2 1.6c.3 0 .5.2.5.5v25.5h7.4c1.1 0 2 .6 2.4 1.6.4 1 .2 2.1-.6 2.8L25.6 49.3c-.7.7-1.6 1.1-2.6 1.1s-1.9-.4-2.6-1.1L3.1 32c-.8-.8-1-1.8-.6-2.8s1.3-1.6 2.4-1.6h7.8V2.1c0-.3.2-.5.5-.5h20z"/><path d="M23 48.9c-.6 0-1.2-.2-1.6-.7L4.1 31c-.5-.5-.3-.9-.2-1.2.1-.2.4-.7 1-.7h9.3v-26h18v26h8.9c.6 0 .9.4 1 .7.1.2.2.8-.2 1.2L24.6 48.2c-.4.5-1 .7-1.6.7m0 3c1.3 0 2.7-.5 3.7-1.5L44 33.1c2.6-2.6.8-7-2.9-7h-5.9v-24c0-1.1-.9-2-2-2h-20c-1.1 0-2 .9-2 2v24H4.9c-3.7 0-5.5 4.4-2.9 7l17.3 17.3c1 1 2.4 1.5 3.7 1.5z"/></svg>';
}

const mapRender = ( status ) => {
	if( status === Status.FAILURE ) {
		console.debug( 'Map Error' );
		return;
	}
	return <IconLoading />;
}

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

	const arrowColours = [
		"#eff8fd", "#ccf0fe", "#9cdbfc", 
		"#acffa7", "#7ede78", "#e6e675", 
		"#ff7d4b", "#e5270c", "#990000"
	];
	const arrowImages = [];

	arrowColours.forEach( colour => {
		const image = new Image( 16, 16 );
		image.src = "data:image/svg+xml," + encodeURIComponent( generateArrow( colour ) );
		arrowImages.push( image );
	} );

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
		// Max chart items 
		const MAX_CHART_ITEMS = 100;
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
							{ 
								label: "Surface Temperature", 
								col: "SST (degC)", 
								key: "surfaceTemperature", 
							}, 
							{ 
								label: "Wind Speed", 
								col: "WindSpeed (m/s)", 
								key: "windSpeed", 
								rotate: "WindDirec (deg)",
							},
							{ 
								label: "Swell", 
								col: "Hsig_swell (m)", 
								key: "swellHeight" 
							},
							{ 
								label: "Seas", 
								col: "Hsig_sea (m)", 
								key: "seasHeight" 
							},
							{
								label: "Barometer",
								col: "Pressure (hPa)",
								key: "barometer"
							}
						]

						// Chart data structure
						let chartData = {};
						dataTypes.forEach( type => {
							const { key } = type;
							chartData[key] = {
								datasets: [ { key, data: [], rotation: [], pointStyle: [] } ],
								labels: []
							}
						} );

						// dataPoints.tp.rotation.push( reverseRotation( wave[] ) );

						// First of all values for box display
						if( buoyDataPoints.length > 0 ) {
							if( buoyDataPoints[0]?.data_points ) {
								const unprocessedData = JSON.parse(buoyDataPoints[0]?.data_points);
								processedData.timeStampUTC = unprocessedData['Timestamp (UTC)'];
								processedData.surfaceTemperature = unprocessedData['SST (degC)'] != "-9999.0" ? parseFloat( unprocessedData['SST (degC)'] ) : null;
								processedData.swellHeight = unprocessedData['Hsig_swell (m)'] != "-9999.00" ? parseFloat( unprocessedData['Hsig_swell (m)'] ) : null;
								processedData.seasHeight = unprocessedData['Hsig_sea (m)'] != "-9999.00" ? parseFloat( unprocessedData[':'] ) : null;
								processedData.swellDirection = unprocessedData['Dm (deg)'] != "-9999.00" ? degreesToDirection( unprocessedData['Dm (deg)'] ): null;
								processedData.windDirection = unprocessedData['WindDirec (deg)'] != "-9999.00" ? degreesToDirection( unprocessedData['WindDirec (deg)'] ) : null;
								processedData.windSpeed = unprocessedData['WindSpeed (m/s)'] != "-9999.00" ? parseFloat( unprocessedData['WindSpeed (m/s)'] ) : null;
								processedData.barometer = unprocessedData['Pressure (hPa)'] != "-9999.00" ? parseFloat( unprocessedData['Pressure (hPa)'] ) : null;
							}

							// Mod value
							const skipMod = Math.ceil( buoyDataPoints.length / MAX_CHART_ITEMS );

							// Wind Speed
							buoyDataPoints.forEach( ( buoy, index ) => {
								// Skip nth items to ensure limits
								if( index % skipMod === 0 ) {
									const rawData = JSON.parse(buoy.data_points);
	
									// Process for each data type
									dataTypes.forEach( type => {
										const { col, key } = type;
										const value = rawData[col];
										if( value != "NaN" && parseInt(value) != -9999 ) {
											chartData[key].datasets[0].data.push( { x: parseInt( buoy.timestamp ) * 1000, y: parseFloat( rawData[col] ) } );
											chartData[key].labels.push( parseInt( buoy.timestamp ) * 1000 );
											if( type.rotate ) {
												const bracket = Math.floor( parseInt( rawData[col] / 2 ) );
												chartData[key].datasets[0].rotation.push( parseFloat( rawData[type.rotate] ) );
												chartData[key].datasets[0].pointStyle.push( arrowImages[ bracket > 8 ? 8 : bracket ] );
											}
										}
									} );
								}
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
										<h6>Sea State <span className="icon"><IconSeaState /></span></h6>
										<p className="level-low">Low</p>
									</div>
									<div className="observation-small sea-state">
										<h6>Surface Temp ({ "\u2103" })<span className="icon"><IconTemperature /></span></h6>
										<p>{ selectedBuoy.processedData.surfaceTemperature 
											? parseFloat( selectedBuoy.processedData.surfaceTemperature ).toFixed(1)
											: "-" 
										}</p>
									</div>
									<div className="observation-small sea-state">
										<h6>Tide <span className="icon"><IconTide /></span></h6>
										<p>-</p>
									</div>
									<div className="observation-small sea-state">
										<h6>Barometer (hSig)<span className="icon"><IconBarometer /></span></h6>
										<p>{ selectedBuoy.processedData.barometer 
											? parseInt( selectedBuoy.processedData.barometer )
											: "-" 
										}</p>
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
											icon={ mapDetails.arrow_icon }
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
											data={ selectedBuoy.chartData.seasHeight }
											heading="Seas (m)"
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
										{ console.log( selectedBuoy.chartData.barometer ) }
										<h5><span className="icon"><IconBarometer /></span> Barometer</h5>
										<LineChart
											data={ selectedBuoy.chartData.barometer }
											heading={ "Barometer (hPa)" }
										/>
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

