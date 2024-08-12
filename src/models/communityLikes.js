import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";
export default (sequelize, DataTypes) => {
  class communityLikes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user, community }) {
      this.belongsTo(community, {
        foreignKey: "id",
        sourceKey: "community_id",
        constraints: true,
      });
      this.belongsTo(user, {
        foreignKey: "id",
        sourceKey: "user_id",
        constraints: true,
      });
    }
  }

  communityLikes.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: DataTypes.INTEGER,
      community_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "communityLikes",
      tableName: TABLES.COMMUNITY_LIKES,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return communityLikes;
};
