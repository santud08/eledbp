import { celebrate, Joi } from "celebrate";
export const communityMessageReply = celebrate({
  body: Joi.object({
    commentable_id: Joi.number().required(),
    commentable_type: Joi.string().required().valid("title", "people"),
    tab_type: Joi.string().required().valid("comment", "trivia", "famous_line", "goofs"),
    community_id: Joi.number().required(),
    reply_text: Joi.string().required(),
    spoiler: Joi.string().allow("").optional().valid("y", "n"),
    image: Joi.string().optional().allow("", null),
  }),
});
