import { Model, Op } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class edit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, editor, people }) {
      // define association here
      this.hasOne(title, {
        sourceKey: "editable_id",
        foreignKey: "id",
        constraints: true,
        scope: {
          "$edit.type$": { [Op.in]: ["movie", "tv", "webtoons"] }, // Only title table
        },
      });

      this.hasOne(editor, {
        foreignKey: "id",
        sourceKey: "editor_id",
        constraints: true,
      });

      this.hasOne(people, {
        sourceKey: "editable_id",
        foreignKey: "id",
        constraints: true,
        scope: {
          "$edit.type$": "people", // Only people table
        },
      });
    }
  }
  edit.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      type: DataTypes.ENUM("movie", "tv", "webtoons", "people"),
      editable_id: DataTypes.BIGINT,
      editor_id: DataTypes.BIGINT,
      operation: DataTypes.STRING,
      modified_date: DataTypes.DATE,
      registration_date: DataTypes.DATE,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "edit",
      tableName: TABLES.EDITS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return edit;
};
