import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class SiteMenus extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ siteMenus }) {
      // define association here
      this.hasMany(siteMenus, {
        as: "sub_menu",
        foreignKey: "parent_menu_id",
        constraints: true,
      });
    }
  }
  SiteMenus.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      menu_name: DataTypes.STRING,
      parent_menu_id: DataTypes.INTEGER,
      menu_key: DataTypes.STRING,
      list_order: DataTypes.INTEGER,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "siteMenus",
      tableName: TABLES.SITE_MENUS,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return SiteMenus;
};
