import { celebrate, Joi } from "celebrate";

export const awardNomineeAdd = celebrate({
  body: Joi.object({
    award_id: Joi.number().required(),
    round_id: Joi.number().required(),
    sector_id: Joi.number().required(),
    work_id: Joi.number().allow(null).allow("").optional(),
    character_id: Joi.number().allow(null).allow("").optional(),
    is_work_thumbnail: Joi.string().optional().allow(null).allow("").valid("y", "n"),
    status: Joi.string().optional().valid("candidate", "winner"),
    comment: Joi.string().allow(null).allow("").optional(),
  }),
});
