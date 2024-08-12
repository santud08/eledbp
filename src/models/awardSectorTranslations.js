import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class awardSectorTranslations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ awardSectors }) {
      // define association here
      this.belongsTo(awardSectors, {
        foreignKey: "award_sector_id",
        constraints: true,
      });
    }
  }
  awardSectorTranslations.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      award_sector_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
      division_name: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "awardSectorTranslations",
      tableName: TABLES.AWARD_SECTOR_TRANSLATIONS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return awardSectorTranslations;
};
