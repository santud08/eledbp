import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class awardTranslation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ awards }) {
      // define association here
      this.belongsTo(awards, {
        foreignKey: "award_id",
        constraints: true,
      });
    }
  }
  awardTranslation.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      award_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
      award_name: DataTypes.STRING,
      award_explanation: DataTypes.TEXT("long"),
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "awardTranslation",
      tableName: TABLES.AWARD_TRANSLATION_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return awardTranslation;
};
