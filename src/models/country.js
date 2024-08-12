import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class country extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ countryTranslation }) {
      this.hasMany(countryTranslation, {
        foreignKey: "country_id",
        constraints: true,
      });

      this.hasOne(countryTranslation, {
        as: "countryTranslationOne",
        foreignKey: "country_id",
        constraints: true,
      });
    }
  }
  country.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      country_name: DataTypes.STRING,
      country_code: DataTypes.STRING,
      status: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "country",
      tableName: TABLES.COUNTRIES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return country;
};
