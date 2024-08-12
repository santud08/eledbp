import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class shared extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, people, awards }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "shared_id",
        constraints: true,
      });

      this.belongsTo(people, {
        foreignKey: "shared_id",
        constraints: true,
      });

      this.belongsTo(awards, {
        foreignKey: "shared_id",
        constraints: true,
      });
    }
  }
  shared.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      shared_id: DataTypes.BIGINT,
      user_id: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      shared_type: DataTypes.ENUM("title", "people", "award"),
      shared_in: DataTypes.ENUM("facebook", "twitter", "mail", "link"),
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "shared",
      tableName: TABLES.SHARED,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return shared;
};
