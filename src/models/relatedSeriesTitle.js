import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class relatedSeriesTitle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, titleImage }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "related_series_title_id",
        constraints: true,
      });
      this.hasMany(titleImage, {
        foreignKey: "title_id",
        sourceKey: "related_series_title_id",
        constraints: true,
      });
    }
  }
  relatedSeriesTitle.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title_id: DataTypes.BIGINT,
      related_series_title_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "relatedSeriesTitle",
      tableName: TABLES.RELATED_SERIES_TITLE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return relatedSeriesTitle;
};
