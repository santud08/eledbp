import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class episodeTranslation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ episode }) {
      // define association here
      this.belongsTo(episode, {
        foreignKey: "episode_id",
        constraints: true,
      });
    }
  }
  episodeTranslation.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      episode_id: DataTypes.BIGINT,
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      url: DataTypes.TEXT,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "episodeTranslation",
      tableName: TABLES.EPISODE_TRANSLATION_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return episodeTranslation;
};
