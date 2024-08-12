import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class awardSectors extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ awardSectorTranslations, awardNominees }) {
      // define association here
      this.hasMany(awardSectorTranslations, {
        foreignKey: "award_sector_id",
        constraints: true,
      });

      this.hasMany(awardNominees, {
        foreignKey: "sector_id",
        constraints: true,
      });

      this.hasOne(awardSectorTranslations, {
        as: "awardSectorTranslationsOne",
        foreignKey: "award_sector_id",
        sourceKey: "id",
        constraints: true,
      });

      this.hasOne(awardSectorTranslations, {
        as: "awardSectorTranslationsOnel",
        foreignKey: "award_sector_id",
        sourceKey: "id",
        constraints: true,
      });
    }
  }
  awardSectors.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      award_id: DataTypes.BIGINT,
      list_order: DataTypes.INTEGER,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "awardSectors",
      tableName: TABLES.AWARD_SECTORS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return awardSectors;
};
