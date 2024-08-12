import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class agencyManager extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ agencyManagerArtist, agencyManagerTranslation }) {
      // define association here
      this.hasMany(agencyManagerArtist, {
        foreignKey: "agency_manager_id",
        constraints: true,
      });
      this.hasMany(agencyManagerTranslation, {
        foreignKey: "agency_manager_id",
        constraints: true,
      });
    }
  }
  agencyManager.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      agency_id: DataTypes.STRING,
      email: DataTypes.TEXT("long"),
      phone_number: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "agencyManager",
      tableName: TABLES.AGENCY_MANAGERS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return agencyManager;
};
