import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class city extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ cityTranslations }) {
      this.hasMany(cityTranslations, {
        foreignKey: "city_id",
        constraints: true,
      });
      this.hasOne(cityTranslations, {
        as: "cityTranslationOne",
        foreignKey: "city_id",
        constraints: true,
      });
    }
  }
  city.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      city_name: DataTypes.STRING,
      city_code: DataTypes.STRING,
      country_id: DataTypes.INTEGER,
      status: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "city",
      tableName: TABLES.CITIIES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return city;
};
