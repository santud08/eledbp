import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class ratings extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ title, people, awards }) {
      // define association here
      this.belongsTo(title, {
        foreignKey: "ratingable_id",
        constraints: true,
      });

      this.belongsTo(people, {
        foreignKey: "ratingable_id",
        constraints: true,
      });

      this.belongsTo(awards, {
        foreignKey: "ratingable_id",
        constraints: true,
      });
    }
  }
  ratings.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      rating: DataTypes.INTEGER,
      ratingable_id: DataTypes.BIGINT,
      user_id: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      ratingable_type: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "ratings",
      tableName: TABLES.RATINGS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return ratings;
};
