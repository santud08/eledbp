import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class cmsPage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  cmsPage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: DataTypes.STRING,
      body: DataTypes.TEXT("long"),
      slug: DataTypes.STRING,
      meta: DataTypes.STRING,
      type: DataTypes.STRING,
      site_language: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      title_id: DataTypes.INTEGER,
      published_at: DataTypes.DATE,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "cmsPage",
      tableName: TABLES.CMS_PAGE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return cmsPage;
};
