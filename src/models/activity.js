import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class activity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user }) {
      // define association here
      this.belongsTo(user, {
        foreignKey: "created_by",
        as: "createdBy",
        constraints: true,
      });

      this.belongsTo(user, {
        foreignKey: "updated_by",
        as: "updatedBy",
        constraints: true,
      });
    }
  }
  activity.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_session_id: DataTypes.STRING,
      ip: DataTypes.STRING,
      access_platform: DataTypes.STRING,
      session_start_at: DataTypes.DATE,
      session_end_at: DataTypes.DATE,
      session_duration: DataTypes.INTEGER,
      utm_source: DataTypes.STRING,
      utm_medium: DataTypes.STRING,
      utm_campaign: DataTypes.STRING,
      utm_term: DataTypes.STRING,
      utm_content: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "activity",
      tableName: TABLES.ACTIVITIES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return activity;
};
