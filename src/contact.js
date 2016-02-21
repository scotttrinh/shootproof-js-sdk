import isUndefined from 'lodash-es/isUndefined';
import isArray from 'lodash-es/isArray';
import isObject from 'lodash-es/isObject';
import map from 'lodash-es/map';
import merge from 'lodash-es/merge';
import { makeApiRequest } from './lib';
import flatten from './utils/flatten';

/**
 * Method to return data on a single contact.
 *
 * @param contactId Number Contact ID to retrieve for.
 * @return Promise Fetch response
 */
function getContactInfo(contactId) {
  if (isUndefined(contactId)) {
    throw new Error('You must supply the ID for the contact.');
  }
  return makeApiRequest({
    method: 'sp.contact.info',
    contact_id: contactId,
  });
}

/**
 * Method to create a new contact.
 *
 * Supported key-value pairs:
 *
 *     brand_id
 *     first_name (required)
 *     last_name
 *     email (required)
 *     phone
 *     business_name
 *     notes
 *     tags (string of tags, separated by commas)
 *     address (object)
 *         address_1
 *         address_2
 *         city
 *         state
 *         state_other
 *         country (required if address is provided)
 *         zip_postal
 *
 * @param contactData Object Object containing contact info
 * @return Promise Fetch response
 */
function createContact(contactData) {
  const params = merge({ method: 'sp.contact.create' }, flatten(contactData));
  return makeApiRequest(params);
}

/**
 * Method to update an existing contact.
 *
 * Supported key-value pairs:
 *
 *     brand_id
 *     first_name (required)
 *     last_name
 *     email (required)
 *     phone
 *     business_name
 *     notes
 *     tags (string of tags, separated by commas)
 *     address (object. set null to remove)
 *         address_1
 *         address_2
 *         city
 *         state
 *         state_other
 *         country (required if address is provided)
 *         zip_postal
 *
 * @param contactId Number Contact ID
 * @param contactData Object Object of contact data.
 * @return Promise Fetch response
 */
function updateContact(contactId, contactData) {
  const params = merge({
    method: 'sp.contact.create',
    contact_id: contactId,
  }, flatten(contactData));
  return makeApiRequest(params);
}

/**
 * Method to create a multiple contacts in bulk.
 *
 * Must be an Array of Objects.  The same key-value pairs
 * in `createContact` are supported in the inner objects.
 *
 * @param contacts Array Array of contact objects
 * @return Promise Fetch response
 */
function bulkCreateContacts(contacts) {
  if (isUndefined(contacts) ||
      !isArray(contacts) ||
      contacts.length === 0 ||
      !isObject(contacts[1])
  ) {
    throw new Error('Must supply an array of contact objects');
  }
  return makeApiRequest({
    method: 'sp.contact.bulk_create',
    contacts: map(contacts, flatten),
  });
}

/**
 * Method to delete a contact.
 *
 * @param contactId Number Contact ID
 * @return Promise Fetch response
 */
function deleteContact(contactId) {
  if (isUndefined(contactId)) {
    throw new Error('The contactId is required to delete a contact.');
  }
  return makeApiRequest({
    method: 'sp.contact.delete',
    contact_id: contactId,
  });
}

export {
  getContactInfo,
  createContact,
  updateContact,
  bulkCreateContacts,
  deleteContact,
};
