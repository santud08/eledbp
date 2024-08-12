import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class ottServiceProvider extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  ottServiceProvider.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ott_name: DataTypes.STRING,
      // type: DataTypes.STRING,
      provider_url: DataTypes.STRING,
      tmdb_provider_id: DataTypes.INTEGER,
      provider_search_url: DataTypes.STRING,
      logo_path: DataTypes.STRING,
      list_order: DataTypes.INTEGER,
      site_language: DataTypes.STRING,
      available_for: DataTypes.STRING,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "ottServiceProvider",
      tableName: TABLES.OTT_SERVICE_PROVIDER_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return ottServiceProvider;
};
