import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.pos(request);

  const { barcode } = await request.json();

  if (!barcode) {
    return Response.json({ found: false, error: "No barcode provided" }, { status: 400 });
  }

  const response = await admin.graphql(
    `#graphql
      query lookupBarcode($query: String!) {
        productVariants(first: 1, query: $query) {
          edges {
            node {
              id
              sku
              product {
                title
              }
            }
          }
        }
      }`,
    {
      variables: {
        query: `metafield:custom.alternate_barcodes:${barcode}`,
      },
    }
  );

  const { data } = await response.json();
  const edge = data?.productVariants?.edges?.[0];

  if (!edge) {
    return Response.json({ found: false });
  }

  const variantIdNumeric = Number(
    edge.node.id.replace("gid://shopify/ProductVariant/", "")
  );

  return Response.json({
    found: true,
    variantIdNumeric,
    sku: edge.node.sku,
    title: edge.node.product.title,
  });
};