import isUndefined from 'lodash-es/isUndefined';
import { makeApiRequest } from './lib';

/**
 * Method to return the albums for an event
 *
 * @param eventId Number Event ID
 * @return Promise Fetch response
 */
function getEventAlbums(eventId) {
  if (isUndefined(eventId)) {
    throw new Error('The eventId is required to check if a photo exists.');
  }
  return makeApiRequest({
    method: 'sp.album.get_list',
    event_id: eventId,
  });
}

/**
 * Method to get the photos for an album
 *
 * @param albumId Number Album ID
 * @param page Number Page number
 * @return Promise Fetch response
 */
function getAlbumPhotos(albumId, page = 1) {
  if (isUndefined(albumId)) {
    throw new Error('The eventId is required to check if a photo exists.');
  }
  return makeApiRequest({
    method: 'sp.album.get_photos',
    album_id: albumId,
    page,
  });
}

/**
 * Method to create a new album in an event
 *
 * @param eventId Number Event ID
 * @param albumName String Album name
 * @param password String (optional) Password
 * @param parentAlbumId Number (optional) Parent album ID
 * @return Promise Fetch response
 */
function createEventAlbum(eventId, albumName, password, parentAlbumId) {
  if (isUndefined(eventId)) {
    throw new Error('The eventId is required to create an album.');
  }
  if (isUndefined(albumName)) {
    throw new Error('The albumName is required to create a new album.');
  }
  return makeApiRequest({
    method: 'sp.album.create',
    event_id: eventId,
    album_name: albumName,
    password,
    parent_id: parentAlbumId,
  });
}

/**
 * Method to create a move album within an event
 *
 * @param albumId Number Album ID
 * @param parentAlbumId Number (optional) Parent album ID
 * @return Promise Fetch response
 */
function moveEventAlbum(albumId, parentAlbumId) {
  if (isUndefined(albumId)) {
    throw new Error('The albumId is required to move an album.');
  }
  return makeApiRequest({
    method: 'sp.album.move',
    album_id: albumId,
    parent_id: parentAlbumId,
  });
}

/**
 * Method to rename an album
 *
 * @param albumId Number Album ID
 * @param albumName String Album name
 * @return Promise Fetch response
 */
function renameEventAlbum(albumId, albumName) {
  if (isUndefined(albumId)) {
    throw new Error('The albumId is required to rename an album.');
  }
  if (isUndefined(albumName)) {
    throw new Error('The albumName is required to create a new album.');
  }
  return makeApiRequest({
    method: 'sp.album.rename',
    album_id: albumId,
    album_name: albumName,
  });
}

/**
 * Method to delete an album
 *
 * @param albumId Number Album ID
 * @return Promise Fetch response
 */
function deleteEventAlbum(albumId) {
  if (isUndefined(albumId)) {
    throw new Error('The albumId is required to delete an album.');
  }
  return makeApiRequest({
    method: 'sp.album.delete',
    album_id: albumId,
  });
}

export {
  getEventAlbums,
  getAlbumPhotos,
  createEventAlbum,
  moveEventAlbum,
  renameEventAlbum,
  deleteEventAlbum,
};
