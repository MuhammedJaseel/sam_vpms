/**
 * Car.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    parkingID: {
      type: 'string'
    },
    plateNumber: {
      type: 'string'
    },
    color: {
      type: 'string',
    },
    brand: {
      type: 'string',
    },
    modelName: {
      type: 'string',
    },
    snap: {
      type: 'string',
    },
    scratchesSnap: {
      type: 'array',
    },
    ownerMobileNumber: {
      type: 'string'
    },
    employeeID : {
        model: 'user'
    },
  }
};
