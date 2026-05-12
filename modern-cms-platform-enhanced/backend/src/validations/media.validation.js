```javascript
const Joi = require('joi');

const createMedia = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    filename: Joi.string().required(),
    path: Joi.string().uri().required(), // Assuming an accessible URL
    mimeType: Joi.string().required(),
    size: Joi.number().integer().min(0).required(),
  }),
};

const getMediaItems = {
  query: Joi.object().keys({
    name: Joi.string(),
    mimeType: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMedia = {
  params: Joi.object().keys({
    mediaId: Joi.string().uuid().required(),
  }),
};

const updateMedia = {
  params: Joi.object().keys({
    mediaId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    path: Joi.string().uri(),
    mimeType: Joi.string(),
    size: Joi.number().integer().min(0),
  }).min(1),
};

const deleteMedia = {
  params: Joi.object().keys({
    mediaId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createMedia,
  getMediaItems,
  getMedia,
  updateMedia,
  deleteMedia,
};
```