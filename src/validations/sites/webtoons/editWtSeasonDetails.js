import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";

export const editWtSeasonDetails = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    tmdb_id: Joi.number().optional().allow("", null),
    season_id: Joi.number().optional().allow("", null),
    draft_request_id: Joi.number().optional().allow("", null),
    season_no: Joi.number().required(),
    season_name: Joi.string().required(),
    site_language: Joi.string().required(),
    draft_season_id: Joi.number().allow(null).allow("").optional(),
    release_date: Joi.date().allow(null).allow("").optional(),
    episode_count: Joi.number().allow(null).allow("").optional(),
    summary: Joi.string().allow(null).allow("").optional(),
    aka: Joi.string().allow(null).allow("").optional(),
    channel: Joi.array()
      .allow(null)
      .allow("")
      .optional()
      .custom((value) => {
        const objKeys = [
          {
            keyName: "id",
            dataType: "number",
            option: "optional",
          },
          {
            keyName: "webtoons_channel_id",
            dataType: "number",
            option: "required",
          },
        ];
        const validateRes = validationHelper.arrayObjectKeyValidate(value, objKeys);
        if (validateRes === true) {
          return value;
        } else {
          throw new Error(`${validateRes}`);
        }
      }),
    search_keyword: Joi.string().allow(null).allow("").optional(),
    news_search_keyword: Joi.string().allow(null).allow("").optional(),
    image_action: Joi.string().allow(null).allow("").optional(),
    read: Joi.array()
      .allow(null)
      .allow("")
      .optional()
      .custom((value) => {
        const objKeys = [
          {
            keyName: "id",
            dataType: "number",
            option: "optional",
          },
          {
            keyName: "ott_provider_id",
            dataType: "number",
            option: "optional",
          },
          {
            keyName: "read_id",
            dataType: "string",
            option: "optional",
          },
        ];
        const validateRes = validationHelper.arrayObjectKeyValidate(value, objKeys);
        if (validateRes === true) {
          return value;
        } else {
          throw new Error(`${validateRes}`);
        }
      }),
    image: Joi.string().optional().allow("", null),
  }),
});
