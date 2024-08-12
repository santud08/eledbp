import { Model, Op } from "sequelize";
import { TABLES, SOUTH_KOREA_COUNTRY } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class people extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({
      peopleTranslation,
      creditable,
      agencyManagerArtist,
      community,
      peopleImages,
      peopleJobs,
      peopleVideos,
      peopleCountries,
      peopleKeywords,
      edit,
      video,
    }) {
      // define association here
      this.hasMany(creditable, {
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasMany(peopleTranslation, {
        foreignKey: "people_id",
        constraints: true,
      });

      this.belongsTo(agencyManagerArtist, {
        foreignKey: "id",
        sourceKey: "people_id",
        constraints: true,
      });

      this.hasMany(community, {
        foreignKey: "commentable_id",
        constraints: true,
      });

      this.hasMany(peopleImages, {
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasMany(peopleImages, {
        as: "peopleImageBg",
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasMany(peopleJobs, {
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasMany(peopleVideos, {
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasOne(peopleTranslation, {
        as: "peopleTranslationOne",
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasOne(peopleImages, {
        as: "peopleImagesOne",
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasOne(peopleCountries, {
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasMany(peopleKeywords, {
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasOne(peopleCountries, {
        as: "kopeopleCountries",
        foreignKey: "people_id",
        scope: { birth_place: { [Op.like]: `%${SOUTH_KOREA_COUNTRY}%` } },
        constraints: true,
      });

      this.hasMany(edit, {
        foreignKey: "editable_id",
        constraints: true,
      });

      this.hasOne(peopleTranslation, {
        as: "peopleTranslationOnel",
        foreignKey: "people_id",
        constraints: true,
      });

      this.hasMany(video, {
        foreignKey: "title_id",
        scope: { "$video.video_for$": "people" },
        constraints: true,
      });
    }
  }

  people.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: DataTypes.STRING,
      gender: DataTypes.STRING,
      birth_date: DataTypes.DATEONLY,
      poster: DataTypes.STRING,
      kobis_id: DataTypes.BIGINT,
      imdb_id: DataTypes.STRING,
      tmdb_id: DataTypes.BIGINT,
      tiving_id: DataTypes.STRING,
      official_site: DataTypes.STRING,
      facebook_link: DataTypes.STRING,
      instagram_link: DataTypes.STRING,
      twitter_link: DataTypes.STRING,
      views: DataTypes.INTEGER,
      allow_update: DataTypes.TINYINT,
      fully_synced: DataTypes.TINYINT,
      popularity: DataTypes.INTEGER,
      death_date: DataTypes.DATE,
      adult: DataTypes.TINYINT,
      popularity_order: DataTypes.INTEGER,
      is_korean_birth_place: DataTypes.TINYINT,
      status: DataTypes.ENUM("active", "deleted"),
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      odk_id: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "people",
      tableName: TABLES.PEOPLE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return people;
};
