import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class video extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, usersActivity, people }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "title_id",
        scope: { "$video.video_for$": "title" },
        constraints: true,
      });

      this.hasMany(usersActivity, {
        foreignKey: "item_id",
        constraints: true,
      });

      this.hasOne(people, {
        foreignKey: "id",
        sourceKey: "title_id",
        scope: { "$video.video_for$": "people" },
        constraints: true,
      });

      this.hasOne(title, {
        as: "titleOne",
        foreignKey: "id",
        sourceKey: "title_id",
        scope: { "$video.video_for$": "title" },
        constraints: true,
      });
    }
  }
  video.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      thumbnail: DataTypes.STRING,
      url: DataTypes.STRING,
      type: DataTypes.STRING,
      quality: DataTypes.STRING,
      title_id: DataTypes.INTEGER,
      season: DataTypes.INTEGER,
      episode: DataTypes.INTEGER,
      source: DataTypes.STRING,
      negative_votes: DataTypes.INTEGER,
      positive_votes: DataTypes.INTEGER,
      reports: DataTypes.INTEGER,
      approved: DataTypes.INTEGER,
      list_order: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      video_source: DataTypes.ENUM("youtube", "vimeo"),
      video_for: DataTypes.ENUM("title", "people"),
      no_of_view: DataTypes.BIGINT,
      ele_no_of_view: DataTypes.BIGINT,
      is_official_trailer: DataTypes.ENUM("y", "n"),
      category: DataTypes.STRING,
      video_duration: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "video",
      tableName: TABLES.VIDEO_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return video;
};
