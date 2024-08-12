import model from "../../../models/index.js";
import { importTmdbDataService } from "../../../services/index.js";
import { Op } from "sequelize";

export const importTmdbDataManually = async (req, res, next) => {
  try {
    const page = req.body.page ? req.body.page : 0;
    const limit = req.body.limit ? req.body.limit : 10;
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
      await importTmdbDataService.importTmdbData(getData, langEn, langKo);
      res.ok({
        message: "success",
      });
    } else {
      res.ok({
        message: "no data found in file to import",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
