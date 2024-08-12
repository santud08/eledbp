import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class peopleJobs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ department }) {
      // define association here
      this.belongsTo(department, {
        foreignKey: "job_id",
        constraints: true,
      });
    }
  }

  peopleJobs.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      people_id: DataTypes.INTEGER,
      job_id: DataTypes.INTEGER,
      list_order: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "peopleJobs",
      tableName: TABLES.PEOPLE_JOB_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return peopleJobs;
};
