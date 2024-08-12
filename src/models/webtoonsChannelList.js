import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class webtoonsChannelList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, ottServiceProvider }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasOne(ottServiceProvider, {
        foreignKey: "id",
        sourceKey: "webtoons_channel_id",
        constraints: true,
      });
    }
  }
  webtoonsChannelList.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title_id: DataTypes.BIGINT,
      url: DataTypes.STRING,
      webtoons_channel_id: DataTypes.INTEGER,
      season_id: DataTypes.BIGINT,
      episode_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "webtoonsChannelList",
      tableName: TABLES.WEBTOONS_CHANNEL_LIST_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return webtoonsChannelList;
};
