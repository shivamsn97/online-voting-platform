"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      election.hasMany(models.questions, { foreignKey: "election_id" });
      election.hasMany(models.voters, { foreignKey: "election_id" });
    }
  }
  election.init(
    {
      title: DataTypes.STRING,
      is_live: DataTypes.BOOLEAN,
      user_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "election",
    }
  );
  return election;
};
