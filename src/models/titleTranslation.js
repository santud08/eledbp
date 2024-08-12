import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleTranslation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ titleImage, relatedTitle, titleKeyword }) {
      // define association here
      this.hasOne(titleImage, {
        foreignKey: "title_id",
        constraints: true,
      });
      this.belongsTo(relatedTitle, {
        foreignKey: "title_id",
        constraints: true,
      });
      this.hasMany(titleKeyword, {
        foreignKey: "title_id",
        sourceKey: "title_id",
        constraints: true,
      });
    }
  }
  titleTranslation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title_id: DataTypes.BIGINT,
      site_language: DataTypes.STRING,
      name: DataTypes.STRING,
      aka: DataTypes.STRING,
      description: DataTypes.STRING,
      tagline: DataTypes.STRING,
      plot_summary: DataTypes.STRING,
      synopsis: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "titleTranslation",
      tableName: TABLES.TITLE_TRANSLATION_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleTranslation;
};
