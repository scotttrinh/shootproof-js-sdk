import isUndefined from 'lodash-es/isUndefined';
import { makeApiRequest } from './lib';

/**
* Method to get the list of orders for a studio
*
* @param page Number Page number
* @return Promise Fetch response
*/
function getOrderList(page = 1) {
  return makeApiRequest({
    method: 'sp.order.get_list',
    page,
  });
}

/**
 * Method to get the details for an order
 *
 * @param orderId Number Order ID
 * @return Promise Fetch response
 */
function getOrderDetails(orderId) {
  if (isUndefined(orderId)) {
    throw new Error('The orderId is required to get the details or an order.');
  }
  return makeApiRequest({
    method: 'sp.order.get_details',
    order_id: orderId,
  });
}

export {
  getOrderList,
  getOrderDetails,
};
