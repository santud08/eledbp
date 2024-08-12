import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class agencyManagerArtist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ people, agencyManager }) {
      // define association here
      this.hasMany(people, {
        foreignKey: "id",
        sourceKey: "people_id",
        constraints: true,
      });
      this.belongsTo(agencyManager, {
        foreignKey: "agency_manager_id",
        constraints: true,
      });
    }
  }
  agencyManagerArtist.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      agency_id: DataTypes.INTEGER,
      agency_manager_id: DataTypes.INTEGER,
      people_id: DataTypes.STRING,
      status: DataTypes.ENUM("active", "inactive", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "agencyManagerArtist",
      tableName: TABLES.AGENCY_MANAGER_ARTIST_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return agencyManagerArtist;
};
