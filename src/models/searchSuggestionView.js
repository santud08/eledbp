import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class searchSuggestionView extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ titleTranslation, peopleTranslation }) {
      this.hasOne(titleTranslation, {
        foreignKey: "title_id",
        sourceKey: "id",
        constraints: true,
      });
      this.hasOne(peopleTranslation, {
        foreignKey: "people_id",
        sourceKey: "id",
        constraints: true,
      });
    }
  }
  searchSuggestionView.init(
    {
      primary_id: DataTypes.INTEGER,
      type: DataTypes.STRING,
      title: DataTypes.STRING,
      updated_at: DataTypes.DATE,
      created_at: DataTypes.DATE,
      language: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "searchSuggestionView",
      tableName: TABLES.SEARCH_SUGGESTION_VIEW_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return searchSuggestionView;
};
