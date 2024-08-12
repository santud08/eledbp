import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class schedulerProcedureJobs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  schedulerProcedureJobs.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      queue: DataTypes.STRING,
      payload: DataTypes.TEXT,
      type: DataTypes.STRING,
      description: DataTypes.TEXT,
      status: DataTypes.ENUM("pending", "processing", "failed", "completed"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "schedulerProcedureJobs",
      tableName: TABLES.SCHEDULER_PROCEDURE_JOBS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return schedulerProcedureJobs;
};
