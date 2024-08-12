import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class peopleTranslation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ creditable, people }) {
      // define association here
      this.hasMany(creditable, {
        foreignKey: "creditable_id",
        constraints: true,
      });
      this.belongsTo(people, {
        foreignKey: "people_id",
        constraints: true,
      });
    }
  }

  peopleTranslation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      people_id: DataTypes.BIGINT,
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      known_for: DataTypes.STRING,
      birth_place: DataTypes.STRING,
      site_language: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "peopleTranslation",
      tableName: TABLES.PEOPLE_TRANSLATION_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return peopleTranslation;
};
