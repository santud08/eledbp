import model from "../../../models/index.js";
import { importTmdbDataService } from "../../../services/index.js";
import { consoleColors } from "../../../utils/constants.js";
import { Op } from "sequelize";

export const getTmdbImportData = async () => {
  try {
    const page = 0;
    const limit = 1;
    const langEn = "en";
    const langKo = "ko";
    const getData = await model.importData.findAll({
      attributes: ["id", "imported_file_id", "type", "tmdb_id", "created_by", "uuid"],
      offset: parseInt(page),
      limit: parseInt(limit),
      where: {
        import_status: "pending",
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.importFiles,
          attributes: [["id", "importfileId"]],
          left: true,
          where: { status: "active" },
          required: true,
        },
      ],
    });

    if (getData && getData.length > 0) {
      console.log(
        `${consoleColors.fg.green} no of ${getData.length} data-found-to-import \n ${consoleColors.reset}`,
      );
      await importTmdbDataService.importTmdbData(getData, langEn, langKo);
      console.log(
        `${consoleColors.fg.green} no of ${getData.length} data-found-imported-successfully \n ${consoleColors.reset}`,
      );
    } else {
      console.log(
        `${consoleColors.fg.crimson} no data found in file to import \n ${consoleColors.reset}`,
      );
    }
  } catch (error) {
    console.log(`${consoleColors.fg.red} ${error}  \n ${consoleColors.reset}`);
  }
};
