<?php
	// Endpoint for wp-json 
	add_action( 'rest_api_init', function () {
		register_rest_route( 'wac/v1', '/map', array(
			'methods' => 'GET',
			'callback' => function() { return get_option('wac_options'); },
		) );
	} );