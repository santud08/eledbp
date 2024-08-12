import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ emailTemplate, userRole, cssTheme, communityLikes, userPoint, editor }) {
      // define association here
      this.hasMany(emailTemplate, {
        foreignKey: "created_by",
        constraints: true,
      });

      this.hasOne(userRole, {
        foreignKey: "user_id",
        constraints: true,
      });

      this.hasOne(cssTheme, {
        foreignKey: "user_id",
        constraints: true,
      });

      this.hasMany(communityLikes, {
        foreignKey: "user_id",
        constraints: true,
      });

      this.hasOne(userPoint, {
        foreignKey: "user_id",
        constraints: true,
      });

      this.hasMany(editor, {
        foreignKey: "user_id",
        constraints: true,
      });
    }
  }
  user.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: DataTypes.STRING,
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      api_token: DataTypes.STRING,
      legacy_permissions: DataTypes.STRING,
      activated: DataTypes.INTEGER,
      activation_code: DataTypes.STRING,
      activated_at: DataTypes.DATE,
      last_login: DataTypes.DATE,
      persist_code: DataTypes.STRING,
      reset_password_code: DataTypes.STRING,
      reset_password_code_exp: DataTypes.DATE,
      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      gender: DataTypes.STRING,
      avatar: DataTypes.STRING,
      background: DataTypes.STRING,
      confirmed: DataTypes.INTEGER,
      confirmation_code: DataTypes.STRING,
      language: DataTypes.STRING,
      country: DataTypes.STRING,
      timezone: DataTypes.STRING,
      stripe_id: DataTypes.STRING,
      available_space: DataTypes.INTEGER,
      withdrawal_reason: DataTypes.TEXT,
      status: DataTypes.ENUM("active", "deleted", "inactive", "withdrawal"),
      remember_token: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "user",
      tableName: TABLES.USER_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return user;
};
