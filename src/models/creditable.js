import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class creditable extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({
      title,
      people,
      peopleTranslation,
      season,
      peopleImages,
      creditableTranslation,
    }) {
      // define association here
      this.hasMany(title, {
        foreignKey: "id",
        sourceKey: "creditable_id",
        constraints: true,
      });

      this.hasOne(people, {
        foreignKey: "id",
        sourceKey: "people_id",
        constraints: true,
      });

      this.hasMany(peopleTranslation, {
        foreignKey: "people_id",
        sourceKey: "people_id",
        constraints: true,
      });

      this.belongsTo(season, {
        foreignKey: "season_id",
        constraints: true,
      });

      this.belongsTo(season, {
        as: "seasonOne",
        foreignKey: "season_id",
        constraints: true,
      });

      this.hasMany(peopleImages, {
        foreignKey: "people_id",
        sourceKey: "people_id",
        constraints: true,
      });

      this.hasMany(creditableTranslation, {
        foreignKey: "creditables_id",
        sourceKey: "id",
        constraints: true,
      });

      this.hasOne(creditableTranslation, {
        as: "creditableTranslationOne",
        foreignKey: "creditables_id",
        sourceKey: "id",
        constraints: true,
      });

      this.hasOne(creditableTranslation, {
        as: "creditableTranslationOnel",
        foreignKey: "creditables_id",
        sourceKey: "id",
        constraints: true,
      });
    }
  }

  creditable.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      people_id: DataTypes.INTEGER,
      creditable_id: DataTypes.INTEGER,
      character_name: DataTypes.STRING,
      list_order: DataTypes.INTEGER,
      department: DataTypes.STRING,
      job: DataTypes.STRING,
      creditable_type: DataTypes.STRING,
      is_guest: DataTypes.INTEGER,
      season_id: DataTypes.INTEGER,
      episode_id: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      status: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "creditable",
      tableName: TABLES.CREDITABLES_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return creditable;
};
