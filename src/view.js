import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import App from './components/App';

domReady( () => {
	const container = document.querySelector(
		'.wp-block-waves-display-compact'
	);

	const root = createRoot( container );
	root.render( <App />, container );
} );
