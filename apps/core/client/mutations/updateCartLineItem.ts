import { newClient } from '..';
import { graphql } from '../generated';
import { UpdateCartLineItemDataInput } from '../generated/graphql';

export const UPDATE_CART_LINE_ITEM_MUTATION = /* GraphQL */ `
  mutation UpdateCartLineItem($input: UpdateCartLineItemInput!) {
    cart {
      updateCartLineItem(input: $input) {
        cart {
          entityId
        }
      }
    }
  }
`;

export const updateCartLineItem = async (
  cartEntityId: string,
  lineItemEntityId: string,
  data: UpdateCartLineItemDataInput,
) => {
  const mutation = graphql(UPDATE_CART_LINE_ITEM_MUTATION);

  const response = await newClient.fetch({
    document: mutation,
    variables: {
      input: {
        cartEntityId,
        lineItemEntityId,
        data,
      },
    },
    fetchOptions: { cache: 'no-store' },
  });

  return response.data.cart.updateCartLineItem?.cart;
};
