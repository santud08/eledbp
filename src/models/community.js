import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";
export default (sequelize, DataTypes) => {
  class community extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, user, people, communityLikes, season, creditable }) {
      this.belongsTo(title, {
        foreignKey: "commentable_id",
        constraints: true,
      });

      this.belongsTo(user, {
        foreignKey: "user_id",
        constraints: true,
      });

      this.belongsTo(people, {
        foreignKey: "commentable_id",
        constraints: true,
      });

      this.hasMany(communityLikes, {
        foreignKey: "community_id",
        constraints: true,
      });

      this.hasMany(community, {
        as: "community_reply",
        foreignKey: "parent_id",
        constraints: true,
      });

      this.belongsTo(season, {
        foreignKey: "season_id",
        constraints: true,
      });

      this.hasOne(title, {
        as: "famouseTitle",
        foreignKey: "id",
        sourceKey: "famouse_id",
        constraints: true,
      });

      this.hasOne(people, {
        as: "famousePeople",
        foreignKey: "id",
        sourceKey: "famouse_id",
        constraints: true,
      });

      this.hasOne(creditable, {
        as: "character",
        foreignKey: "id",
        sourceKey: "character_id",
        constraints: true,
      });
    }
  }

  community.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      content: DataTypes.TEXT,
      is_spoiler: DataTypes.STRING,
      parent_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      commentable_id: DataTypes.BIGINT,
      file_original_name: DataTypes.STRING,
      file_type: DataTypes.STRING,
      file_name: DataTypes.STRING,
      community_type: DataTypes.STRING,
      commentable_type: DataTypes.INTEGER,
      famouse_id: DataTypes.INTEGER,
      season_id: DataTypes.BIGINT,
      character_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "community",
      tableName: TABLES.COMMUNITY,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return community;
};
