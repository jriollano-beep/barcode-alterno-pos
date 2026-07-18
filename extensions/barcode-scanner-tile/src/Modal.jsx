import "@shopify/ui-extensions/preact";
import {render} from 'preact';
import {useState, useEffect, useRef} from 'preact/hooks';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [status, setStatus] = useState('idle'); // idle | looking | found | not_found | error
  const [lastScan, setLastScan] = useState('');
  const [foundInfo, setFoundInfo] = useState(null);
  const lastScannedRef = useRef('');

  useEffect(() => {
    // Activa la cámara del dispositivo como scanner
    shopify.scanner.showCameraScanner();

    const unsubscribe = shopify.scanner.scannerData.current.subscribe(async (scan) => {
      const data = scan?.data;
      if (!data || data === lastScannedRef.current) return;
      lastScannedRef.current = data;

      setLastScan(data);
      setStatus('looking');
      setFoundInfo(null);

      try {
        const token = await shopify.session.getSessionToken();

        const response = await fetch('/api/lookup-barcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({barcode: data}),
        });

        const result = await response.json();

        if (result.found) {
          await shopify.cart.addLineItem(result.variantIdNumeric, 1);
          setStatus('found');
          setFoundInfo(result);
        } else {
          setStatus('not_found');
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    });

    return () => {
      shopify.scanner.hideCameraScanner();
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (
    <s-page heading="Barcode Alterno">
      <s-scroll-box>
        <s-box padding="small">
          {status === 'idle' && (
            <s-text>Apunta la cámara al barcode viejo del producto.</s-text>
          )}
          {status === 'looking' && (
            <s-text>Buscando "{lastScan}"...</s-text>
          )}
          {status === 'found' && foundInfo && (
            <s-text>✅ Agregado: {foundInfo.title} ({foundInfo.sku})</s-text>
          )}
          {status === 'not_found' && (
            <s-text>❌ No se encontró ningún producto con el barcode: {lastScan}</s-text>
          )}
          {status === 'error' && (
            <s-text>⚠️ Error al buscar. Intenta de nuevo.</s-text>
          )}
        </s-box>
      </s-scroll-box>
    </s-page>
  );
}