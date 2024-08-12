import { celebrate, Joi } from "celebrate";
import { validationHelper } from "../../../helpers/index.js";

export const addWebtoonSeasonDetails = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    draft_season_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    season_no: Joi.number().required(),
    season_name: Joi.string().required(),
    release_date: Joi.date().allow(null).allow("").optional(),
    episode_count: Joi.number().allow(null).allow("").optional(),
    summary: Joi.string().allow(null).allow("").optional(),
    aka: Joi.string().allow(null).allow("").optional(),
    channel: Joi.array().items(Joi.number().optional()).allow(null).allow("").optional(),
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
            keyName: "ott_provider_id",
            dataType: "number",
            option: "required",
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
