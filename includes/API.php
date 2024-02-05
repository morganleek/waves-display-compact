<?php
	// Endpoint for wp-json 
	add_action( 'rest_api_init', function () {
		register_rest_route( 'wac/v1', '/map', array(
			'methods' => 'GET',
			'callback' => function() { 
				$now = current_time('U'); // With local timezone
				$now_format = current_time('Y-m-d H:i:s');
				$options = get_option('wac_options');
				return array_merge( 
					array( 
						'now' => $now, 
						'now_format' => $now_format,
						'time_zone' => wp_timezone()
					), 
					$options 
				); 
			},
		) );
	} );

	// Tides
	// efad5012-3df3-4ad4-a326-5dd1daaf7c1d
	// Devonport, TAS
	// https://api.willyweather.com.au/v2/ZWI2MzBlMmE3MTk3ZDE1NjU1M2FkZT/locations/10520.json
	// https://api.willyweather.com.au/v2/ZWI2MzBlMmE3MTk3ZDE1NjU1M2FkZT/locations/10520/weather.json
	//  Content-Type: application/json
	//  x-payload: {"forecasts": ["tides"], "days": 1, "startDate": "2024-02-01"}

	// add_action( 'rest_api_init', function () {
	// 	register_rest_route( 'wac/v1', '/rss', array(
	// 		'methods' => 'GET',
	// 		'callback' => function() { 
	// 			$options = get_option('wac_options');
	// 			if( !empty( $options['rss_url'] ) ) {
	// 				$xml = file_get_contents( $options['rss_url'] );
	// 				return $xml;
	// 			}
	// 			return ['No RSS Set'];
	// 		},
	// 	) );
	// } );