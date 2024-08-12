import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class relatedTitle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, titleImage }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "related_title_id",
        constraints: true,
      });
      this.hasMany(titleImage, {
        foreignKey: "title_id",
        sourceKey: "related_title_id",
        constraints: true,
      });
    }
  }
  relatedTitle.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title_id: DataTypes.BIGINT,
      related_title_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
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
      modelName: "relatedTitle",
      tableName: TABLES.RELATED_TITLE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return relatedTitle;
};
