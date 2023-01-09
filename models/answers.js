"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class answers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      answers.belongsTo(models.questions, { foreignKey: "question_id" });
    }

    static async addAnswer(question_id, value) {
      // if already exists, raise error
      // else, create new answer
      const ans = await answers.findOne({ where: { question_id, value } });
      if (ans) {
        throw new Error("Answer already exists");
      }
      return answers.create({ question_id, value });
    }
  }
  answers.init(
    {
      question_id: DataTypes.INTEGER,
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "answers",
    }
  );
  return answers;
};
