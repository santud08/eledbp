import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class editor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user }) {
      // define association here
      this.hasOne(user, {
        foreignKey: "id",
        sourceKey: "user_id",
        constraints: true,
      });
    }
  }
  editor.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: DataTypes.BIGINT,
      editable_id: DataTypes.BIGINT,
      editable_type: DataTypes.ENUM("movie", "tv", "webtoons", "people"),
      current_status: DataTypes.ENUM("allocate", "deallocate"),
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "editor",
      tableName: TABLES.EDITORS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return editor;
};
