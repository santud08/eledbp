import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleCountries extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ country, title }) {
      // define association here
      this.belongsTo(country, {
        foreignKey: "country_id",
        constraints: true,
      });

      this.belongsTo(title, {
        foreignKey: "title_id",
        constraints: true,
      });
    }
  }
  titleCountries.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title_id: DataTypes.BIGINT,
      country_id: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "titleCountries",
      tableName: TABLES.TITLE_COUNTRIES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleCountries;
};
