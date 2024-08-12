import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class awardNominees extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ awardSectors, awardRounds, title, people, awards }) {
      // define association here

      this.hasOne(awardSectors, {
        foreignKey: "id",
        sourceKey: "sector_id",
        constraints: true,
      });

      this.hasOne(awardRounds, {
        foreignKey: "id",
        sourceKey: "round_id",
        constraints: true,
      });

      this.hasOne(title, {
        foreignKey: "id",
        sourceKey: "work_id",
        constraints: true,
      });

      this.hasOne(people, {
        foreignKey: "id",
        sourceKey: "character_id",
        constraints: true,
      });

      this.hasOne(awards, {
        foreignKey: "id",
        sourceKey: "award_id",
        constraints: true,
      });
    }
  }
  awardNominees.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      award_id: DataTypes.BIGINT,
      round_id: DataTypes.BIGINT,
      sector_id: DataTypes.BIGINT,
      work: DataTypes.STRING,
      work_id: DataTypes.BIGINT,
      character: DataTypes.STRING,
      character_id: DataTypes.BIGINT,
      nominee_type: DataTypes.ENUM("candidate", "winner"),
      comment: DataTypes.TEXT,
      is_work_thumbnail: DataTypes.ENUM("y", "n"),
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "awardNominees",
      tableName: TABLES.AWARD_NOMINEES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return awardNominees;
};
