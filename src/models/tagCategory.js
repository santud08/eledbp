import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class tagCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ tagCategoryTranslation, tag }) {
      // define association here
      this.hasMany(tagCategoryTranslation, {
        foreignKey: "tag_category_id",
        constraints: true,
      });
      this.hasMany(tag, {
        foreignKey: "tag_main_category_id",
        constraints: true,
      });
      this.hasOne(tagCategoryTranslation, {
        as: "tagCategoryTranslationOne",
        foreignKey: "tag_category_id",
        constraints: true,
      });
    }
  }
  tagCategory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      parent_id: DataTypes.INTEGER,
      slug_name: DataTypes.STRING,
      tag_catgeory_type: DataTypes.ENUM("custom", "predefine"),
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "tagCategory",
      tableName: TABLES.TAG_CATEGORY_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return tagCategory;
};
