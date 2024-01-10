import domReady from "@wordpress/dom-ready";
import { render } from "@wordpress/element";
import App from './components/App';

domReady( () => {
	const container = document.querySelector( '.wp-block-waves-display-compact' );

	render( <App />, container );
} );