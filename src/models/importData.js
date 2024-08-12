import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class importData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ importFiles }) {
      // define association here
      this.belongsTo(importFiles, {
        foreignKey: "imported_file_id",
        constraints: true,
      });
    }
  }
  importData.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      imported_file_id: DataTypes.BIGINT,
      item_id: DataTypes.BIGINT,
      type: DataTypes.ENUM("movie", "tv", "webtoons", "people"),
      uuid: DataTypes.STRING,
      tmdb_id: DataTypes.BIGINT,
      kobis_id: DataTypes.STRING,
      imdb_id: DataTypes.STRING,
      tiving_id: DataTypes.STRING,
      title_name: DataTypes.STRING,
      aka: DataTypes.STRING,
      description: DataTypes.TEXT,
      plot_summary: DataTypes.TEXT,
      affiliate_link: DataTypes.TEXT,
      search_keywords: DataTypes.TEXT("long"),
      news_search_keywords: DataTypes.TEXT("long"),
      title_status: DataTypes.STRING,
      release_date: DataTypes.DATE,
      re_release_date: DataTypes.TEXT("long"),
      footfalls: DataTypes.INTEGER,
      runtime: DataTypes.INTEGER,
      certification: DataTypes.STRING,
      language: DataTypes.TEXT("long"),
      country: DataTypes.TEXT("long"),
      original_works: DataTypes.TEXT("long"),
      genre: DataTypes.TEXT("long"),
      gender: DataTypes.STRING,
      birth_date: DataTypes.DATE,
      death_date: DataTypes.DATE,
      message: DataTypes.TEXT,
      import_status: DataTypes.ENUM("completion", "failure", "overlap"),
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "importData",
      tableName: TABLES.IMPORT_DATA_LOGS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return importData;
};
