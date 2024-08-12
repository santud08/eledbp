import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class countryTranslation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ country }) {
      this.belongsTo(country, {
        foreignKey: "country_id",
        constraints: true,
      });
    }
  }
  countryTranslation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      country_id: DataTypes.INTEGER,
      country_name: DataTypes.STRING,
      site_language: DataTypes.STRING,
      status: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "countryTranslation",
      tableName: TABLES.COUNTRIES_TRANSLATION_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return countryTranslation;
};
