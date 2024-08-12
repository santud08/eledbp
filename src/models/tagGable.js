import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class tagGable extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, titleImage, tag, tagTranslation }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "taggable_id",
        constraints: true,
      });
      this.hasMany(titleImage, {
        foreignKey: "title_id",
        sourceKey: "taggable_id",
        constraints: true,
      });
      this.hasMany(tag, {
        foreignKey: "id",
        sourceKey: "tag_id",
        constraints: true,
      });
      this.hasMany(tagTranslation, {
        foreignKey: "tag_id",
        sourceKey: "tag_id",
        constraints: true,
      });
    }
  }

  tagGable.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tag_id: DataTypes.INTEGER,
      taggable_id: DataTypes.INTEGER,
      taggable_type: DataTypes.STRING,
      site_language: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      score: DataTypes.INTEGER,
      status: DataTypes.ENUM("active", "deleted"),
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tagGable",
      tableName: TABLES.TAG_GABLE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return tagGable;
};
