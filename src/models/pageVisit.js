import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class pageVisit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user, activity }) {
      // define association here
      this.belongsTo(user, {
        foreignKey: "user_id",
        constraints: true,
      });

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
  pageVisit.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      activity_id: DataTypes.BIGINT,
      user_id: DataTypes.INTEGER,
      user_email: DataTypes.STRING,
      page_url: DataTypes.STRING,
      referrer_url: DataTypes.STRING,
      page_title: DataTypes.STRING,
      view_start_at: DataTypes.DATE,
      view_end_at: DataTypes.DATE,
      view_duration: DataTypes.INTEGER,
      page_type: DataTypes.ENUM(
        "movie",
        "tv",
        "webtoons",
        "people",
        "video",
        "award",
        "tag",
        "company",
      ),
      details: DataTypes.JSON,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "pageVisit",
      tableName: TABLES.PAGE_VISITS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return pageVisit;
};
