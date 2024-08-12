import model from "../../../models/index.js";

/**
 * genreList
 * @param req
 * @param res
 */

export const genreList = async (req, res, next) => {
  try {
    let getGenreList = [];
    const language = req.accept_language;

    // get genre list
    let getGenre = await model.tag.findAll({
      attributes: ["id", "type"],
      where: {
        type: "genre",
        status: "active",
      },
      include: [
        {
          model: model.tagTranslation,
          attributes: ["tag_id", "display_name", "site_language"],
          left: true,
          where: { status: "active" },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ],
    });

    if (getGenre) {
      let list = [];
      for (const eachRow of getGenre) {
        if (eachRow) {
          const record = {
            tag_id: eachRow.tagTranslations[0].tag_id ? eachRow.tagTranslations[0].tag_id : "",
            genre_name: eachRow.tagTranslations[0].display_name
              ? eachRow.tagTranslations[0].display_name
              : "",
          };
          list.push(record);
        }
      }
      getGenreList = list;
    }
    res.ok({
      genre_list: getGenreList,
    });
  } catch (error) {
    next(error);
  }
};
