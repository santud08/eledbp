import model from "../../../models/index.js";
import { schedulerJobService } from "../../../services/index.js";
import { Op } from "sequelize";

export const addPeopleMediaInScheduleJob = async (req, res, next) => {
  try {
    const page = req.body.page ? req.body.page : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const getData = await model.people.findAll({
      attributes: ["id", "tmdb_id", "created_by"],
      offset: parseInt(page),
      limit: parseInt(limit),
      where: {
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.peopleTranslation,
        },
      ],
      order: [["id", "ASC"]],
    });
    let createdBy = null;
    let payload = null;
    if (getData && getData.length > 0) {
      for (const data of getData) {
        const getTmbdId = data.tmdb_id;
        const peopleId = data.id;
        createdBy = data.created_by;

        if (getTmbdId && peopleId) {
          if (payload == null) {
            payload = { list: [] };
          }

          payload.list.push({
            tmdb_id: getTmbdId,
            site_language: "en",
            people_id: peopleId,
            created_by: createdBy,
          });
        }
      }
      console.log("payload", payload);
      if (payload && payload.list && payload.list.length > 0) {
        await schedulerJobService.addJobInScheduler(
          "people media update",
          JSON.stringify(payload),
          "people_media",
          "",
          createdBy,
        );
        res.ok({
          message: "success",
        });
      } else {
        res.ok({
          message: "no data updated",
        });
      }
    } else {
      res.ok({
        message: "no data found to update",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
