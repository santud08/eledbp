import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class awards extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({
      awardImages,
      awardTranslation,
      awardRounds,
      awardNominees,
      country,
      city,
      awardSectors,
    }) {
      // define association here
      this.hasMany(awardTranslation, {
        foreignKey: "award_id",
        constraints: true,
      });

      this.hasMany(awardImages, {
        foreignKey: "award_id",
        constraints: true,
      });

      this.hasMany(awardRounds, {
        foreignKey: "award_id",
        constraints: true,
      });

      this.hasMany(awardNominees, {
        foreignKey: "award_id",
        constraints: true,
      });

      this.hasOne(awardImages, {
        as: "awardImageOne",
        foreignKey: "award_id",
        constraints: true,
      });

      this.belongsTo(country, {
        as: "countryOne",
        foreignKey: "country_id",
        constraints: true,
      });

      this.belongsTo(city, {
        as: "cityOne",
        foreignKey: "city_id",
        constraints: true,
      });

      this.hasOne(awardTranslation, {
        as: "awardTranslationOne",
        foreignKey: "award_id",
        sourceKey: "id",
        constraints: true,
      });

      this.hasOne(awardTranslation, {
        as: "awardTranslationOnel",
        foreignKey: "award_id",
        sourceKey: "id",
        constraints: true,
      });

      this.hasMany(awardSectors, {
        foreignKey: "award_id",
        constraints: true,
      });

      this.hasOne(country, {
        foreignKey: "id",
        sourceKey: "country_id",
        constraints: true,
      });
    }
  }
  awards.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: DataTypes.STRING,
      type: DataTypes.STRING,
      country_id: DataTypes.INTEGER,
      //city_id: DataTypes.INTEGER,
      place: DataTypes.STRING,
      //start_date: DataTypes.DATE,
      //end_date: DataTypes.DATE,
      city_name: DataTypes.STRING,
      event_month: DataTypes.INTEGER,
      news_search_keyword: DataTypes.TEXT,
      website_url: DataTypes.TEXT,
      avg_rating: DataTypes.FLOAT,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "awards",
      tableName: TABLES.AWARDS,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return awards;
};
