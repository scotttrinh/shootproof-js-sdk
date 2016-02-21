import isEmpty from 'lodash-es/isEmpty';
import isUndefined from 'lodash-es/isUndefined';
import { makeApiRequest } from './lib';

/**
 * Method to return all open events for a studio
 *
 * @param brandId Number (optional) Brand ID to retrieve list for.
 * @return Promise Fetch response
 */
function getEvents(brandId) {
  const params = {
    method: 'sp.event.get_list',
  };
  if (!isUndefined(brandId)) {
    params.brandId = brandId;
  }
  return makeApiRequest(params);
}

/**
 * Method to create a new event
 *
 * @param name String Event name
 * @param brandId String (optional) Brand ID
 * @param date String (optional) Event date as ISO8601 date string
 * @return Promise Fetch response
 */
function createEvent(name, brandId, date) {
  if (isUndefined(name)) {
    throw new Error('You must set the name for a new event');
  }
  const params = {
    method: 'sp.event.create',
    event_name: name,
  };
  if (!isUndefined(brandId)) {
    params.brand_id = brandId;
  }
  if (!isUndefined(date)) {
    params.event_date = date;
  }
  return makeApiRequest(params);
}

/**
 * Method to delete an event
 *
 * @param eventId Number Event ID to delete
 * @return Promise Fetch response
 */
function deleteEvent(eventId) {
  if (isUndefined(eventId)) {
    throw new Error('You must supply an event ID if you wish to delete an event');
  }

  return makeApiRequest({
    method: 'sp.event.delete',
    event_id: eventId,
  });
}

/**
 * Method to check if a photo exists in an event
 *
 * @param eventId Number Event ID
 * @param photoFileName String Photo file name
 * @return Promise Fetch response
 */
function photoExistsInEvent(eventId, photoFileName) {
  if (isUndefined(eventId) || isUndefined(photoFileName)) {
    throw new Error('You must provide an event ID and photo filename');
  }
  return makeApiRequest({
    method: 'sp.event.photo_exists',
    event_id: eventId,
    photo_name: photoFileName,
  });
}

/**
 * Method to set the event access level and password
 *
 * @param eventId Number Event ID
 * @param accessLevel String Access Level string
 * @param password String (optional) Event password
 * @return Promise Fetch response
 */
function setEventAccessLevel(eventId, accessLevel, password) {
  if (isUndefined(eventId) || isUndefined(accessLevel)) {
    throw new Error('You must define an event ID and an access level');
  }

  const params = {
    method: 'sp.event.set_access_level',
    event_id: eventId,
    access_level: accessLevel,
  };

  if (!isEmpty(password)) {
    params.password = password;
  }

  return makeApiRequest(params);
}

/**
 * Method to get photos for an event
 *
 * @param eventId Number Event ID
 * @param page Number Page number
 * @return Promise Fetch response
 */
function getEventPhotos(eventId, page) {
  if (isUndefined(eventId)) {
    throw new Error('You must define an event ID');
  }

  return makeApiRequest({
    method: 'sp.event.get_photos',
    event_id: eventId,
    page,
  });
}

export {
  getEvents,
  createEvent,
  deleteEvent,
  photoExistsInEvent,
  setEventAccessLevel,
  getEventPhotos,
};
