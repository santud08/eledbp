import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class episode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ episodeTranslation }) {
      // define association here
      this.hasMany(episodeTranslation, {
        foreignKey: "episode_id",
        constraints: true,
      });
    }
  }
  episode.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      poster: DataTypes.STRING,
      release_date: DataTypes.DATE,
      title_id: DataTypes.BIGINT,
      season_id: DataTypes.BIGINT,
      season_number: DataTypes.INTEGER,
      episode_number: DataTypes.INTEGER,
      allow_update: DataTypes.TINYINT,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      temp_id: DataTypes.STRING,
      tmdb_vote_count: DataTypes.INTEGER,
      tmdb_vote_average: DataTypes.DECIMAL(3, 1),
      local_vote_average: DataTypes.DECIMAL(3, 1),
      year: DataTypes.SMALLINT,
      popularity: DataTypes.INTEGER,
      tmdb_id: DataTypes.STRING,
      rating_percent: DataTypes.DECIMAL(5, 2),
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "episode",
      tableName: TABLES.EPISODE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return episode;
};
