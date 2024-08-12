import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class agency extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ agencyTranslation }) {
      // define association here
      this.hasMany(agencyTranslation, {
        foreignKey: "agency_id",
        constraints: true,
      });

      this.hasOne(agencyTranslation, {
        as: "agencyTranslationOne",
        foreignKey: "agency_id",
        constraints: true,
      });
    }
  }
  agency.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      agency_code: DataTypes.STRING,
      email: DataTypes.STRING,
      fax: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      site_link: DataTypes.STRING,
      instagram_link: DataTypes.STRING,
      facebook_link: DataTypes.STRING,
      twitter_link: DataTypes.STRING,
      youtube_link: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "agency",
      tableName: TABLES.AGENCY_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return agency;
};
