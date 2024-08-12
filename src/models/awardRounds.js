import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class awardRounds extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ awardNominees }) {
      // define association here
      this.hasMany(awardNominees, {
        foreignKey: "round_id",
        constraints: true,
      });
    }
  }
  awardRounds.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      award_id: DataTypes.BIGINT,
      year: DataTypes.INTEGER,
      round: DataTypes.INTEGER,
      round_name: DataTypes.STRING,
      round_date: DataTypes.DATE,
      round_end_date: DataTypes.DATE,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "awardRounds",
      tableName: TABLES.AWARD_ROUNDS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return awardRounds;
};
