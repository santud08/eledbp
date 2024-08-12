import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class agencyTranslation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ agency }) {
      // define association here
      this.belongsTo(agency, {
        foreignKey: "agency_id",
        constraints: true,
      });
    }
  }
  agencyTranslation.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      agency_id: DataTypes.STRING,
      name: DataTypes.STRING,
      address: DataTypes.TEXT("long"),
      aka: DataTypes.STRING,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "agencyTranslation",
      tableName: TABLES.AGENCY_TRANSLATION_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return agencyTranslation;
};
