import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ tagTranslation, tagCategory }) {
      // define association here
      this.hasMany(tagTranslation, {
        foreignKey: "tag_id",
        constraints: true,
      });

      this.belongsTo(tagCategory, {
        foreignKey: "tag_main_category_id",
        constraints: true,
      });

      this.hasOne(tagCategory, {
        as: "tagCategoryOne",
        foreignKey: "id",
        sourceKey: "tag_main_category_id",
        constraints: true,
      });

      this.hasOne(tagCategory, {
        as: "subCategory",
        foreignKey: "id",
        sourceKey: "tag_category_id",
        constraints: true,
      });

      this.hasOne(tagTranslation, {
        as: "tagTranslationOne",
        foreignKey: "tag_id",
        sourceKey: "id",
        constraints: true,
      });

      this.hasOne(tagTranslation, {
        as: "tagTranslationOnel",
        foreignKey: "tag_id",
        sourceKey: "id",
        constraints: true,
      });
    }
  }

  tag.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      display_name: DataTypes.STRING,
      type: DataTypes.STRING,
      tag_category_id: DataTypes.INTEGER,
      tag_main_category_id: DataTypes.INTEGER,
      source_input: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tag",
      tableName: TABLES.TAG_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return tag;
};
