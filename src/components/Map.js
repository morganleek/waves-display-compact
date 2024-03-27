import { useEffect, useState, useRef } from "@wordpress/element";

export const addSingleMarkers = ( { locations, map, icon, onSelect } ) => {
  locations.map(
    ( { id, position } ) => {
      const marker = new google.maps.Marker( {
        id,
        position,
        map,
				icon: {
					url: icon,
					scaledSize: new google.maps.Size(15, 30)
				}
      } );
      marker.addListener( "click", () => { 
        onSelect( marker.id );
      } ); 
      return marker;
    }
  );
}

const Map = ( { center, zoom, bounds, markers, icon, onSelect } ) => {
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
		addSingleMarkers( { locations: markers, map, icon, onSelect } );

		// Move to cover bounds set in backend
		map.fitBounds( bounds );
  } );

  return <div ref={ref} id="map" />;
}
export default Map;