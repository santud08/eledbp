import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class peopleVideos extends Model {
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
  peopleVideos.init(
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
      people_id: DataTypes.BIGINT,
      source: DataTypes.STRING,
      negative_votes: DataTypes.INTEGER,
      positive_votes: DataTypes.INTEGER,
      reports: DataTypes.INTEGER,
      approved: DataTypes.INTEGER,
      list_order: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      is_official_trailer: DataTypes.ENUM("y", "n"),
      category: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "peopleVideos",
      tableName: TABLES.PEOPLE_VIDEO_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return peopleVideos;
};
