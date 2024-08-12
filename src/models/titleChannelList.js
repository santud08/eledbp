import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleChannelList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ tvNetworks }) {
      // define association here
      this.belongsTo(tvNetworks, {
        foreignKey: "tv_network_id",
        constraints: true,
      });

      this.hasOne(tvNetworks, {
        as: "tvNetworkOne",
        foreignKey: "id",
        sourceKey: "tv_network_id",
        constraints: true,
      });
    }
  }
  titleChannelList.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title_id: DataTypes.BIGINT,
      url: DataTypes.STRING,
      tv_network_id: DataTypes.INTEGER,
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
      modelName: "titleChannelList",
      tableName: TABLES.TITLE_CHANNEL_LIST_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleChannelList;
};
