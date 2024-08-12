import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class peopleCountries extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ country, people }) {
      // define association here
      this.belongsTo(country, {
        foreignKey: "country_id",
        constraints: true,
      });

      this.belongsTo(people, {
        foreignKey: "people_id",
        constraints: true,
      });
    }
  }
  peopleCountries.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      people_id: DataTypes.BIGINT,
      country_id: DataTypes.INTEGER,
      birth_place: DataTypes.STRING,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "peopleCountries",
      tableName: TABLES.PEOPLE_COUNTRIES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return peopleCountries;
};
