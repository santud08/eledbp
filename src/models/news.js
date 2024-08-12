import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class news extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ topNewsMapping }) {
      // define association here
      this.hasOne(topNewsMapping, {
        foreignKey: "news_id",
        constraints: true,
      });
    }
  }
  news.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title: DataTypes.STRING,
      body: DataTypes.TEXT("long"),
      slug: DataTypes.STRING,
      meta: DataTypes.STRING,
      type: DataTypes.STRING,
      site_language: DataTypes.STRING,
      published_date: DataTypes.DATE,
      update_period: DataTypes.STRING,
      update_frequency: DataTypes.INTEGER,
      rss_link: DataTypes.STRING,
      category: DataTypes.TEXT,
      creator_name: DataTypes.STRING,
      list_image: DataTypes.STRING,
      guid_text: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "news",
      tableName: TABLES.NEWS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return news;
};
