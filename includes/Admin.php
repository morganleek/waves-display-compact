<?php
	// Admin Options
	function wac_options_page_html() {
		if (!current_user_can('manage_options')) {
			return;
		}
		?>
			<div class="wrap">
				<h1><?= esc_html(get_admin_page_title()); ?></h1>
				<form method="post" action="options.php"> 
					<?php 
						settings_fields( 'wac-buoy-options' ); 
						do_settings_sections( 'wac-buoy-options' );

						$options = get_option('wac_options');
						$options_tables = array(
							array(
								'title' => 'Google Maps',
								'fields' => array(
									array( 
										'label' => 'Google Maps API Key',
										'name' => 'maps_key'
									),
									array( 
										'label' => 'Map Centre Lat Min',
										'name' => 'maps_lat_min'
									),
									array( 
										'label' => 'Map Centre Lng Min',
										'name' => 'maps_lng_min',
									),
									array( 
										'label' => 'Map Centre Lat Max',
										'name' => 'maps_lat_max'
									),
									array( 
										'label' => 'Map Centre Lng Max',
										'name' => 'maps_lng_max',
									),
									array( 
										'label' => 'Map Marker Icon',
										'name' => 'maps_marker_icon',
									),
									array( 
										'label' => 'Arrow Icon',
										'name' => 'arrow_icon',
									)
								)
							)
						);

						foreach( $options_tables as $table ) {
							if( !empty( $table['title'] ) ) {
								print "<h2 class='title'>" . $table['title'] . "</h2>";
							}
							if( !empty( $table['fields'] ) ) {
							?>
								<table class="form-table">
									<tbody>
										<?php
											foreach( $table['fields'] as $field ) {
												$name = 'wac_options[' . $field['name'] . ']';
												$type = isset( $field['type'] ) ? $field['type'] : 'text';
												$value = $type == 'text' ? esc_attr( isset( $options[$field['name']] ) ? $options[$field['name']] : '' ) : '1';
												$checked = $type == 'checkbox' ? checked( '1', $options[$field['name']], false ) : '';
												print '<tr>';
													print '<th scope="row"><label for="' . $name . '">' . $field['label'] . '</label></th>';
													print '<td>';
														print '<input 
															name="' . $name . '" 
															type="' . $type. '" 
															id="' . $name . '" 
															value="' . $value . '" 
															' . $checked . '
															placeholder="' . $field['placeholder'] . '" 
															' . ( isset( $field['disabled'] ) ? 'disabled="disabled"' : '' ) . '
															class="regular-text">';
														print isset( $field['description'] ) ? '<p>' . $field['description'] . '</p>' : '';
													print '</td>';
													
												print '</tr>';
											}
										?>
									</tbody>
								</table>
							<?php
							}
						}
					?>
					<?php submit_button(); ?>
				</form>
			</div>
		<?php
	}

	function wac_options_page() {
		add_menu_page(
			'Wave Display Compact Dashboard',
			'Wave Display',
			'manage_options',
			'wac',
			'wac_options_page_html',
			'dashicons-admin-site-alt',
			20
		);
	}

	function wac_register_settings() {
		// Register Settings Options
		register_setting( 
			'wac-buoy-options', 
			'wac_options',
			array(
				'sanitize_callback' => 'wac_sanitize_options'
			)
		);		
	}

	function wac_sanitize_options( $option ) {
		// Sanitize Settings Options
		// todo
		return $option;
	}

	// Hooks
	add_action('admin_menu', 'wac_options_page');
	add_action('admin_init', 'wac_register_settings');