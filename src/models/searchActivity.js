import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class searchActivity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user, activity }) {
      // define association here
      this.belongsTo(user, {
        foreignKey: "created_by",
        as: "createdBy",
        constraints: true,
      });

      this.belongsTo(user, {
        foreignKey: "updated_by",
        as: "updatedBy",
        constraints: true,
      });

      this.belongsTo(activity, {
        foreignKey: "activity_id",
        constraints: true,
      });
    }
  }
  searchActivity.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      activity_id: DataTypes.BIGINT,
      search_text: DataTypes.STRING,
      landing_text: DataTypes.STRING,
      browse_page_url: DataTypes.STRING,
      search_sort: DataTypes.STRING,
      item_id: DataTypes.BIGINT,
      item_type: DataTypes.ENUM(
        "movie",
        "tv",
        "webtoons",
        "people",
        "video",
        "award",
        "tag",
        "company",
      ),
      release_date: DataTypes.DATE,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "searchActivity",
      tableName: TABLES.SEARCH_ACTIVITY_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return searchActivity;
};
