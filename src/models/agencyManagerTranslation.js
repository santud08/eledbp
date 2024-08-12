import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class agencyManagerTranslation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ agencyManager }) {
      // define association here
      this.belongsTo(agencyManager, {
        foreignKey: "agency_manager_id",
        constraints: true,
      });
    }
  }
  agencyManagerTranslation.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      agency_manager_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "agencyManagerTranslation",
      tableName: TABLES.AGENCY_MANAGER_TRANSLATION_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return agencyManagerTranslation;
};
