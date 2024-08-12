import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class userRolePermission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ permission, role }) {
      // define association here
      this.hasOne(permission, {
        foreignKey: "id",
        sourceKey: "permission_id",
        constraints: true,
      });
      this.hasOne(role, {
        foreignKey: "id",
        sourceKey: "user_role_id",
        constraints: true,
      });
    }
  }
  userRolePermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_role_id: DataTypes.INTEGER,
      permission_id: DataTypes.INTEGER,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "userRolePermission",
      tableName: TABLES.USER_ROLE_PERMISSION,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return userRolePermission;
};
