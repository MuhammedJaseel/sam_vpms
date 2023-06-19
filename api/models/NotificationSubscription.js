module.exports = {
  attributes: {
    user: {
      type: "string",
      unique: true,
      primaryKey: true,
      required: true,
    },
    registrationTokens: {
      type: "array",
    },
  },
};
