import { useEffect, useState, useRef } from "@wordpress/element";

export const addSingleMarkers = ( { locations, map, icon } ) => {
  locations.map(
    position =>
      new google.maps.Marker( {
        position,
        map,
				icon: {
					url: icon,
					scaledSize: new google.maps.Size(15, 30)
				}
      } ),
  );
}

const Map = ( { center, zoom, bounds, markers, icon } ) => {
  const ref = useRef();

  useEffect(() => {
		// console.log( markers );
    const map = new window.google.maps.Map( ref.current, {
      center,
      zoom,
			streetViewControl: false,
			mapTypeControl: false
    } );
		
		// Add markers
		addSingleMarkers( { locations: markers, map, icon } );

		// Move to cover bounds set in backend
		map.fitBounds( bounds );
  } );

  return <div ref={ref} id="map" />;
}
export default Map;