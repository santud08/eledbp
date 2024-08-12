import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class season extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, community, seasonTranslation, episode }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(community, {
        foreignKey: "season_id",
        constraints: true,
      });

      this.hasMany(seasonTranslation, {
        foreignKey: "season_id",
        constraints: true,
      });

      this.hasMany(episode, {
        foreignKey: "season_id",
        constraints: true,
      });
    }
  }
  season.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      release_date: DataTypes.DATEONLY,
      release_date_to: DataTypes.DATEONLY,
      poster: DataTypes.STRING,
      number: DataTypes.INTEGER,
      season_name: DataTypes.STRING,
      title_id: DataTypes.BIGINT,
      title_tmdb_id: DataTypes.BIGINT,
      allow_update: DataTypes.TINYINT,
      summary: DataTypes.STRING,
      aka: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      episode_count: DataTypes.INTEGER,
      fully_synced: DataTypes.TINYINT,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "season",
      tableName: TABLES.SEASON_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return season;
};
