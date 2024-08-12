import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ titleTranslation, title }) {
      // define association here
      this.belongsTo(titleTranslation, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.belongsTo(title, {
        foreignKey: "title_id",
        constraints: true,
      });
    }
  }
  titleImage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      original_name: DataTypes.STRING,
      file_name: DataTypes.STRING,
      url: DataTypes.STRING,
      path: DataTypes.STRING,
      file_size: DataTypes.STRING,
      mime_type: DataTypes.STRING,
      file_extension: DataTypes.STRING,
      title_id: DataTypes.BIGINT,
      season_id: DataTypes.BIGINT,
      episode_id: DataTypes.BIGINT,
      source: DataTypes.STRING,
      approved: DataTypes.INTEGER,
      list_order: DataTypes.INTEGER,
      image_category: DataTypes.ENUM("image", "bg_image", "poster_image"),
      is_main_poster: DataTypes.ENUM("y", "n"),
      site_language: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
      status: DataTypes.ENUM("active", "deleted"),
    },
    {
      sequelize,
      modelName: "titleImage",
      tableName: TABLES.TITLE_IMAGE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleImage;
};
