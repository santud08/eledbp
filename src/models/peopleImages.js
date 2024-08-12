import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class peopleImages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ people }) {
      // define association here
      this.belongsTo(people, {
        foreignKey: "people_id",
        constraints: true,
      });
    }
  }
  peopleImages.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      original_name: DataTypes.STRING,
      file_name: DataTypes.STRING,
      url: DataTypes.TEXT,
      path: DataTypes.STRING,
      file_size: DataTypes.STRING,
      mime_type: DataTypes.STRING,
      file_extension: DataTypes.STRING,
      people_id: DataTypes.BIGINT,
      source: DataTypes.STRING,
      approved: DataTypes.INTEGER,
      list_order: DataTypes.INTEGER,
      image_category: DataTypes.ENUM("image", "bg_image", "poster_image"),
      is_main_poster: DataTypes.ENUM("y", "n"),
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "peopleImages",
      tableName: TABLES.PEOPLE_IMAGE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return peopleImages;
};
