<?php
	// Endpoint for wp-json 
	add_action( 'rest_api_init', function () {
		register_rest_route( 'wac/v1', '/map', array(
			'methods' => 'GET',
			'callback' => function() { return get_option('wac_options'); },
		) );
	} );

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