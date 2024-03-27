import { useEffect, useState } from "@wordpress/element";
import axios from '../lib/axios';
// Date
import * as dayjs from 'dayjs';
import classNames from 'classnames'
// import { useForm } from "react-hook-form";
import { ReactComponent as IconLoading } from '../images/fade-stagger-squares.svg';
import { ReactComponent as IconWind } from '../images/icon-wind-cropped.svg';
import { ReactComponent as IconSwell } from '../images/icon-swell-cropped.svg';
import { ReactComponent as IconTide } from '../images/icon-tide-cropped.svg';
import { ReactComponent as IconSeaState } from '../images/icon-sea-state-cropped.svg';
import { ReactComponent as IconTemperature } from '../images/icon-temperature-cropped.svg';
import { ReactComponent as IconBarometer } from '../images/icon-barometer-cropped.svg';
import { ReactComponent as IconArrowUp } from '../images/icon-arrow-up-14.svg';
import { ReactComponent as IconArrowDown } from '../images/icon-arrow-down-14.svg';
import { swellRating, swellClass } from '../lib/swell';
import { getSimpleDirection } from '../lib/direction';

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

// const degreesToDirection = degrees => {
// 	const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
// 	const reverse = ( parseInt(degrees) + 180 ) % 360;
// 	const rough = ( reverse + ( 360 + 22.5 ) ) % 360; // Move 22.5 degrees counter clockwise
// 	const section = Math.floor( rough / 45 ); // Narrow to 1 of 8 directions
// 	return directions[section];
// }

const ScaleButtons = ( { zoom, setZoom } ) => (
	<div className="scaleButtons">
		{ zoom > 0 && ( 
			<>
				<button className={ classNames( { 'disabled': zoom >= 7 } ) } onClick={ () => { if( zoom < 7 ) { setZoom( zoom + 1 ) } } }>-</button>
				<button className={ classNames( { 'disabled': zoom <= 1 } ) } onClick={ () => { if( zoom > 1 ) { setZoom( zoom - 1 ) } } }>+</button>
			</>
		) }
	</div>
);

const BackToTop = () => (
	<a className="back-to-top" onClick={ () => { document.querySelector( ".latest-observations" )?.scrollIntoView( { behavior: 'smooth' } ) } }></a>
);

function App(props) {
	const [buoys, setBuoys] = useState([]);
	const [buoyId, setBuoyId] = useState(null);
	const [selectedBuoy, setSelectedBuoy] = useState(null);
	const [mapDetails, setMapDetails] = useState(null);
	const [seaState, setSeaState] = useState(null);
	// const [rss, setRss] = useState(null);
	const [maxItems, setMaxItems] = useState( window.innerWidth < 450 ? 50 : 200 );
	const [buoyDataPoints, setBuoyDataPoints] = useState(null);
	const [buoyTideData, setBuoyTideData] = useState(null);
	const [buoyNextTide, setBuoyNextTide] = useState(null);
	const [loadingBuoy, setLoadingBuoy] = useState(true);
	const [zoom, setZoom] = useState(3); // 1 - 7

	const arrowColours = [
		"#ccf0fe", "#9cdbfc", "#acffa7", "#7ede78", "#e6e675", 
		"#ff7d4b", "#e5270c", "#990000", "#000000"
	];
	// const seaStates = [
	// 	{ label: 'Calm', colour: "#43997c" },
	// 	{ label: 'Slight', colour: "#acffa7" },
	// 	{ label: 'Moderate', colour: "#e6e675"},
	// 	{ label: 'Extreme', colour: '#ff7d4b' },
	// 	{ label: 'Rough', colour: '#e5270c' },
	// 	{ label: 'Very Rough', colour: '#990000' },
	// 	{ label: 'Extreme', colour: '#000000' },
	// ];
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
		// RSS
		// if( !rss ) {
		// 	fetch('http://www.bom.gov.au/fwo/IDZ00072.warnings_marine_tas.xml')
		// 		.then(response => response.text())
		// 		.then(str => new window.DOMParser().parseFromString(str, "text/xml"))
		// 		.then(data => {
		// 			console.log(data);
		// 			setRss( true );
		// 		} );
		// }
// Draw chart
		if( buoyDataPoints && buoyTideData ) {
			
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
					rotateColour: true,
					rotateColourMin: 0,
					rotateColourMax: 15
				},
				{ 
					label: "Swell", 
					col: "Hsig_swell (m)", 
					key: "swellHeight",
					rotate: "Dm (deg)",
					rotateColour: true,
					rotateColourMin: 0, 
					rotateColourMax: 6
				},
				{
					label: "Period", // Mean
					col: "Tm (s)", 
					key: "period"
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
				},
				{
					label: "Tides",
					col: "Height (m)",
					key: "tide"
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
					// console.log( unprocessedData );
					processedData.timeStampUTC = unprocessedData['Timestamp (UTC)'];
					processedData.surfaceTemperature = unprocessedData['SST (degC)'] != "-9999.0" ? parseFloat( unprocessedData['SST (degC)'] ) : null;
					processedData.swellHeight = unprocessedData['Hsig_swell (m)'] != "-9999.00" ? parseFloat( unprocessedData['Hsig_swell (m)'] ) : null;
					processedData.seasHeight = unprocessedData['Hsig_sea (m)'] != "-9999.00" ? parseFloat( unprocessedData[':'] ) : null;
					processedData.swellDirection = unprocessedData['Dm (deg)'] != "-9999.00" ? getSimpleDirection( unprocessedData['Dm (deg)'] ): null;
					processedData.windDirectionNumerical = unprocessedData['WindDirec (deg)'] != "-9999.00" ? unprocessedData['WindDirec (deg)'] : null;
					processedData.windDirection = unprocessedData['WindDirec (deg)'] != "-9999.00" ? getSimpleDirection( unprocessedData['WindDirec (deg)'] ) : null;
					processedData.windSpeed = unprocessedData['WindSpeed (m/s)'] != "-9999.00" ? Math.round( parseFloat( unprocessedData['WindSpeed (m/s)'] ) * 1.94384 ) : null;
					processedData.barometer = unprocessedData['Pressure (hPa)'] != "-9999.00" ? parseFloat( unprocessedData['Pressure (hPa)'] ) : null;
					
					// Work out sea state
					setSeaState( processedData.swellHeight );
				}
				if( buoyDataPoints[2]?.data_points && processedData.barometer ) {
					const unprocessedData = JSON.parse(buoyDataPoints[2]?.data_points);
					if( unprocessedData['Pressure (hPa)'] != "-9999.00" ) {
						const barometerPrevious = parseFloat( processedData.barometer );
						processedData.barometerChange = processedData.barometer < barometerPrevious 
							? -1 
							: processedData.barometer > barometerPrevious 
								? 1 
								: -1; // 0
					}
				}

				// Limit dataset based on limits
				const buoyDataPointsClone = [ ...buoyDataPoints ];
				buoyDataPointsClone.splice(0, Math.ceil( ( zoom / 7 ) * maxItems ) ).forEach( buoy => {
					const rawData = JSON.parse(buoy.data_points);

					// Process for each data type
					dataTypes.forEach( type => {
						const { col, key } = type;
						const value = rawData[col];
						if( value != "NaN" && parseInt(value) != -9999 && key != "tide" ) {
							// Convert windSpeed from m/s to knots
							const yData = ( key === "windSpeed" ) ? parseFloat( parseFloat( rawData[col] ) * 1.94384 ).toFixed(1) : parseFloat( rawData[col] );
							chartData[key].datasets[0].data.push( { x: parseInt( buoy.timestamp ) * 1000, y: yData } );
							chartData[key].labels.push( parseInt( buoy.timestamp ) * 1000 );
							// Has arrows
							if( type.rotate ) {
								chartData[key].datasets[0].rotation.push( Math.floor( parseFloat( rawData[type.rotate] ) ) );
								// Colour arrows
								if( type.rotateColour && Number.isInteger( type.rotateColourMin ) && Number.isInteger( type.rotateColourMax ) ) {
									let bracket = 0;
									if( parseInt( rawData[col] ) > type.rotateColourMax ) {
										bracket = 8;
									}
									else if( parseInt( rawData[col] ) < type.rotateColourMin ) {
										bracket = 0;
									}
									else {
										bracket = Math.round( ( parseInt( rawData[col] ) - type.rotateColourMin ) / ( type.rotateColourMax - type.rotateColourMin ) * 8 );
									}
									
									// Full colour
									chartData[key].datasets[0].pointStyle.push( arrowImages[ bracket > 8 ? 8 : bracket ] );
								}
								else {
									// No colour
									chartData[key].datasets[0].pointStyle.push( arrowImages[ 0 ] );
								}
							}
						}
					} );
					// }
				} );
			}

			// Tides
			if( buoyTideData.length > 0 ) {
				// const buoyTideDataClone = [ ...buoyTideData ];
				// buoyTideDataClone.splice(0, maxItems ).forEach( buoy => {

				// } );
				// Table value
				processedData.tide = parseFloat( buoyTideData[0]['height'] );
				processedData.tideTime = dayjs( buoyTideData[0]['timestamp'] ).format( "h:mma" );

				// Chart values
				
				buoyTideData.forEach( ( tide ) => {
					chartData['tide'].datasets[0].data.push( { x: parseInt( tide.timestamp ) * 1000, y: parseFloat( tide.height ) } );
					chartData['tide'].labels.push( parseInt( tide.timestamp ) * 1000 );
				} );
			}

			// console.log( chartData );
			
			setSelectedBuoy( {
				buoyId,
				processedData, 
				chartData 
			} );
			setLoadingBuoy( false );
			// Setup buoys
			// setSelectedBuoy( { ...response.data, processedData, chartData } );
		}
		// Fetch Map details
		else if( mapDetails == null ) {
			axios
				.get('/wp-json/wac/v1/map')
				.then(response => {
					if (response.status == 200) {
						setMapDetails( response.data );
					}
				})
				.catch( e => { console.debug(e) } );
		}

		
	}, [buoyDataPoints, maxItems, zoom]);

	// Change max items if screen width changes
	let resizeTimeoutId;
	window.addEventListener( 'resize', () => {
		clearTimeout(resizeTimeoutId);
		// Only run after 500ms
		resizeTimeoutId = setTimeout( () => {
			setMaxItems( window.innerWidth < 450 ? 50 : 150 );
		}, 500 );
	} );

	const updateBuoy = (newBuoyId) => {
		setLoadingBuoy( true );
		// Set ID except when reselecting the default 
		if (newBuoyId > 0) {
			// Fetch buoy values
			axios.get('/wp-admin/admin-ajax.php?action=waf_rest_list_buoy_datapoints', {
					params: {
						id: newBuoyId,
						range: 10
					}
				})
				.then(response => {
					if (response.status == 200) {
						// const buoyDataPoints = response.data.data;
						setBuoyId(newBuoyId);
						setBuoyDataPoints(response.data.data);
					}
				})
				.catch((e) => { console.debug(e); });
			
			// Fetch tide buoy data
			const now = parseInt( Date.now() / 1000 );
			axios.get('/wp-admin/admin-ajax.php?action=waf_rest_list_buoy_tide_data&start=' + now, {
				params: {
					id: newBuoyId
				}
			})
			.then(response => {
				if (response.status == 200) {
					setBuoyTideData(response.data.data);

					// Reverse data - oldest to newest
					let tideData = [...response.data.data].reverse();
					// Loop through until greater than now
					for(let i = 0; i < tideData.length; i++ ) {
						if( parseInt( tideData[i].timestamp ) > mapDetails.now ) {
							setBuoyNextTide( {
								timeStamp: parseInt( tideData[i].timestamp ),
								height: tideData[i].height,
								isFalling: i > 0 ? tideData[i] < tideData[i - 1] : true // Can't know for sure if it's the first
							} );
							break;
						}
					}
				}
			})
			.catch((e) => { console.debug(e); });
		}
		// else {
		// 	// Back to map
		// 	setBuoyId( null );
		// }
	};

	return (
		buoys.length > 0
			? (
				<>
					<div className="heading">
						{/* { selectedBuoy
							? <h4>{ buoys.filter( buoy => parseInt(buoy.id) == selectedBuoy.buoyId ).map( buoy => buoy.web_display_name ) }</h4>
							: undefined
						} */}
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
								{ loadingBuoy
									? <div className="loading"><IconLoading /></div>
									: <>
										<h4>Latest observations</h4>
										<div className="observations">
											<div 
												className="observation wind"
												onClick={ () => { document.querySelector('.chart-wrapper.wind')?.scrollIntoView( { behavior: 'smooth' } ) } }	
											>
													<h5>Wind <IconWind /></h5>
												<div class="metric">
													<h6 className="label">Direction</h6>
													<p>{ selectedBuoy.processedData.windDirection
														? selectedBuoy.processedData.windDirection
														: "-" 
													}</p>
												</div>
												<div class="metric">
													<h6 className="label">Speed</h6>
													{ selectedBuoy.processedData.windSpeed
														? ( <p>{ selectedBuoy.processedData.windSpeed }<small>kn</small></p> )
														: ( <p>-</p> )
													}
												</div>
											</div>
											<div 
												className="observation swell"
												onClick={ () => { document.querySelector('.chart-wrapper.swell')?.scrollIntoView( { behavior: 'smooth' } ) } }	
											>
												<h5>Swell <IconSwell /></h5>
												<div class="metric">
													<h6 className="label">Direction</h6>
													<p>{ selectedBuoy.processedData.swellDirection
														? selectedBuoy.processedData.swellDirection
														: "-" 
													}</p>
												</div>
												<div class="metric">
													<h6 className="label">Height</h6>
													{ selectedBuoy.processedData.swellHeight 
														? ( <p>{ selectedBuoy.processedData.swellHeight }<small>m</small></p> )
														: ( <p>-</p> )
													}
												</div>
											</div>
											<div 
												className="observation-small sea-state"
												onClick={ () => { document.querySelector('.chart-wrapper.sea-state')?.scrollIntoView( { behavior: 'smooth' } ) } }
											>
												<h6><span className="icon"><IconSeaState /></span> Sea State</h6>
												{ seaState != null
													? ( <p className={ "level-" + swellClass( seaState ) }>{ swellRating( seaState ) }</p> )
													: ( <p>-</p> )
												}
											</div>
											<div 
												className="observation-small sea-temperature"
												onClick={ () => { document.querySelector('.chart-wrapper.temperature')?.scrollIntoView( { behavior: 'smooth' } ) } }
											>
												<h6><span className="icon"><IconTemperature /></span> Surface Temp</h6>
												{ selectedBuoy.processedData.surfaceTemperature 
													? ( <p>{ parseFloat( selectedBuoy.processedData.surfaceTemperature ).toFixed(1)}<sup>{ "\u2103" }</sup></p> )
													: ( <p>-</p> ) 
												}
											</div>
											<div 
												className="observation-small sea-tide"
												onClick={ () => { document.querySelector('.chart-wrapper.tide')?.scrollIntoView( { behavior: 'smooth' } ) } }
											>
												<h6><span className="icon"><IconTide /></span> Tide</h6>
												{ buoyNextTide
													? ( <p>
														<small className="tide-direction">{ buoyNextTide.isFalling ? ( <>Falling <IconArrowDown /></> ) : ( <>Rising <IconArrowUp /></> ) }</small>
														<small>{ dayjs( buoyNextTide.timeStamp * 1000 ).format( "h:mma" ) }</small>
													</p> )
													: ( <p>-</p> )
												}
											</div>
											<div 
												className="observation-small sea-barometer"
												onClick={ () => { document.querySelector('.chart-wrapper.barometer')?.scrollIntoView( { behavior: 'smooth' } ) } }	
											>
												<h6><span className="icon"><IconBarometer /></span> Barometer</h6>
												{ selectedBuoy.processedData.barometer 
													? ( <p className="tide-direction">{ parseInt( selectedBuoy.processedData.barometer ) }<small>hPa</small> <small>{ selectedBuoy.processedData?.barometerChange ? ( <IconArrowDown /> ) : ( <IconArrowUp /> ) }</small></p> )
													: ( <p>-</p> )
												}
											</div>
										</div>
										
										{ ( seaState && seaState > 1 ) 
											? (
												<div className="coastal-warnings">
													<p><a href="http://www.bom.gov.au/marine/" target="_blank">Check BOM Coastal Warnings</a></p>
												</div>
											) 
											: undefined
										}
										<h4>Historical Observations</h4>
										<div className="historic-observations">
											<div className="chart-wrapper wind">
												<div className="chart-header">
													<BackToTop />
													<h5><span className="icon"><IconWind /></span> Wind</h5>
													<ScaleButtons zoom={ zoom } setZoom={ setZoom } />
												</div>
												<LineChart
													data={ selectedBuoy.chartData.windSpeed }
													heading={ "Wind Speed (kn)" }
													icon={ mapDetails.arrow_icon }
													smooth={ 0 }
												/>
											</div>
											<div className="chart-wrapper swell">
												<div className="chart-header">
													<BackToTop />
													<h5><span className="icon"><IconSwell /></span> Swell & Period</h5>
													<ScaleButtons zoom={ zoom } setZoom={ setZoom } />
												</div>
												<LineChart
													data={ [ selectedBuoy.chartData.swellHeight, selectedBuoy.chartData.period ] }
													heading="Swell (m)"
													headingTwo="Period (s)"
													icon={ mapDetails.arrow_icon }
													smooth={ 0 }
												/>
											</div>
											<div className="chart-wrapper sea-state">
												<div className="chart-header">
													<BackToTop />
													<h5><span className="icon"><IconSeaState /></span> Seas</h5>
													<ScaleButtons zoom={ zoom } setZoom={ setZoom } />
												</div>
												<LineChart
													data={ selectedBuoy.chartData.seasHeight }
													heading="Seas (m)"
													smooth={ 0 }
												/>
											</div>
											<div className="chart-wrapper temperature">
												<div className="chart-header">
													<BackToTop />
													<h5><span className="icon"><IconTemperature /></span> Surface Temperature</h5>
													<ScaleButtons zoom={ zoom } setZoom={ setZoom } />
												</div>
												<LineChart
													data={ selectedBuoy.chartData.surfaceTemperature }
													heading={ "Temperature (\u2103)" }
													smooth={ 0 }
												/>
											</div>
											<div className="chart-wrapper tide">
												<div className="chart-header">
													<BackToTop />
													<h5><span className="icon"><IconTide /></span> Tide</h5>
													<ScaleButtons zoom={ -1 } setZoom={ null } />
												</div>
												<LineChart
													data={ selectedBuoy.chartData.tide }
													heading={ "Tide Height (m)" }
													smooth={ 0.7 }
												/>
											</div>
											<div className="chart-wrapper barometer">
												<div className="chart-header">
													<BackToTop />
													<h5><span className="icon"><IconBarometer /></span> Barometer</h5>
													<ScaleButtons zoom={ zoom } setZoom={ setZoom } />
												</div>
												<LineChart
													data={ selectedBuoy.chartData.barometer }
													heading={ "Barometer (hPa)" }
													smooth={ 0 }
												/>
											</div>
										</div>
									</>
								}
							</div>
						)
					}
				</>
			)
			: <div className="loading"><IconLoading /></div>
	);
}

export default App;

