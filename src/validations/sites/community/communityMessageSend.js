import { celebrate, Joi } from "celebrate";
export const communityMessageSend = celebrate({
  body: Joi.object({
    commentable_id: Joi.number().required(),
    season_id: Joi.number().allow(null).allow("").optional(),
    commentable_type: Joi.string().required().valid("title", "people"),
    tab_type: Joi.string().required().valid("comment", "trivia", "famous_line", "goofs"),
    message_text: Joi.string().required(),
    spoiler: Joi.string().allow("").optional().valid("y", "n"),
    famouse_id: Joi.number()
      .required()
      .when("tab_type", {
        is: Joi.string().valid("famous_line"),
        then: Joi.number().required(),
      })
      .concat(
        Joi.number()
          .optional()
          .when("tab_type", {
            is: Joi.string().valid("comment", "trivia", "goofs"),
            then: Joi.number().allow(null).allow("").optional(),
          }),
      ),
    image: Joi.string().optional().allow("", null),
  }),
});
