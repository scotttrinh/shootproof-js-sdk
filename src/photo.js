import isUndefined from 'lodash-es/isUndefined';
import { makeApiRequest } from './lib';

/**
 * Method to delete a photo from an event
 *
 * @param photoId Number Photo ID
 * @return Promise Fetch response
 */
function deletePhoto(photoId) {
  if (isUndefined(photoId)) {
    throw new Error('The photoId is required to delete a photo.');
  }
  return makeApiRequest({
    method: 'sp.photo.delete',
    photo_id: photoId,
  });
}

export {
  deletePhoto,
};
