import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class favourites extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, people, awards }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "favourable_id",
        constraints: true,
      });

      this.belongsTo(people, {
        foreignKey: "favourable_id",
        constraints: true,
      });

      this.belongsTo(awards, {
        foreignKey: "favourable_id",
        constraints: true,
      });
    }
  }
  favourites.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      favourable_id: DataTypes.BIGINT,
      user_id: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      favourable_type: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "favourites",
      tableName: TABLES.FAVOURITES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return favourites;
};
