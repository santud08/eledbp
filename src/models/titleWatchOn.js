import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleWatchOn extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ ottServiceProvider }) {
      // define association here
      this.belongsTo(ottServiceProvider, {
        foreignKey: "provider_id",
        sourceKey: "id",
        constraints: true,
      });
    }
  }
  titleWatchOn.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title_id: DataTypes.BIGINT,
      movie_id: DataTypes.STRING,
      url: DataTypes.STRING,
      type: DataTypes.ENUM("stream", "rent", "buy", "read"),
      provider_id: DataTypes.INTEGER,
      season_id: DataTypes.BIGINT,
      episode_id: DataTypes.BIGINT,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "titleWatchOn",
      tableName: TABLES.TITLE_WATCH_ON_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleWatchOn;
};
