import "@shopify/ui-extensions/preact";
import {render} from 'preact';

export default async () => {
  render(<Extension />, document.body);
}

function Extension() {
  return (
    <s-tile
      heading="Barcode Alterno"
      subheading="Buscar producto por barcode viejo"
      onClick={() => shopify.action.presentModal()}
    />
  );
}