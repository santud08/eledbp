import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class userPoint extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user }) {
      // define association here
      this.belongsTo(user, {
        foreignKey: "user_id",
        constraints: true,
      });
    }
  }
  userPoint.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: DataTypes.INTEGER,
      request_review_id: DataTypes.BIGINT,
      point: DataTypes.INTEGER,
      point_type: DataTypes.ENUM("credit", "debit"),
      section: DataTypes.STRING,
      sub_section: DataTypes.STRING,
      field_name: DataTypes.STRING,
      action_type: DataTypes.ENUM("add", "edit", "delete"),
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "userPoint",
      tableName: TABLES.USER_POINTS,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return userPoint;
};
